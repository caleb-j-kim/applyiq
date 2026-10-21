package com.applyiq.ai;

import com.applyiq.applications.JobApplication;
import com.applyiq.applications.JobApplicationService;
import com.applyiq.common.exception.AiServiceException;
import com.applyiq.common.exception.ResourceNotFoundException;
import com.applyiq.resumes.Resume;
import com.applyiq.resumes.ResumeService;
import com.applyiq.users.User;
import com.applyiq.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Orchestrates one match analysis: run the free Java extraction pass first,
 * hand its output to Claude for the part that actually needs reasoning, then
 * merge the two into one response and persist it.
 */
@Service
@RequiredArgsConstructor
public class ResumeMatchService {

    private final SkillExtractionService skillExtractionService;
    private final ClaudeClient claudeClient;
    private final ResumeMatchAnalysisRepository repository;
    private final JobApplicationService jobApplicationService;
    private final ResumeService resumeService;
    private final UserService userService;

    public MatchAnalysisResponse analyzeForApplication(UUID userId, UUID applicationId, MatchScoreRequest request) {
        JobApplication application = jobApplicationService.getOwned(userId, applicationId);
        if (application.getJobDescription() == null || application.getJobDescription().isBlank()) {
            throw new AiServiceException("This application has no job description to analyze.");
        }
        Resume resume = resumeService.getOwned(userId, request.resumeId());

        ResumeMatchAnalysis analysis = runAnalysis(userId, resume, application.getJobDescription(),
                request.includeBulletSuggestions());
        analysis.setJobApplication(application);
        return MatchAnalysisResponse.from(repository.save(analysis));
    }

    public MatchAnalysisResponse preview(UUID userId, MatchScorePreviewRequest request) {
        Resume resume = resumeService.getOwned(userId, request.resumeId());

        ResumeMatchAnalysis analysis = runAnalysis(userId, resume, request.jobDescription(),
                request.includeBulletSuggestions());
        return MatchAnalysisResponse.from(repository.save(analysis));
    }

    public MatchAnalysisResponse getLatestForApplication(UUID userId, UUID applicationId) {
        // Confirms ownership even though the id isn't used directly below — getOwned throws if
        // this application doesn't belong to userId, which the analysis lookup alone wouldn't.
        jobApplicationService.getOwned(userId, applicationId);
        ResumeMatchAnalysis analysis = repository
                .findFirstByJobApplication_IdAndUser_IdOrderByCreatedAtDesc(applicationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("No match analysis yet for this application"));
        return MatchAnalysisResponse.from(analysis);
    }

    /**
     * Only the latest analysis per tracked application counts, so re-running a match doesn't
     * skew the charts. Preview analyses have no application to dedupe on and each count once.
     */
    @Transactional(readOnly = true)
    public MatchAnalyticsResponse getAnalytics(UUID userId) {
        Set<UUID> seenApplications = new HashSet<>();
        List<ResumeMatchAnalysis> counted = new ArrayList<>();
        for (ResumeMatchAnalysis analysis : repository.findByUser_IdOrderByCreatedAtDesc(userId)) {
            JobApplication application = analysis.getJobApplication();
            if (application == null || seenApplications.add(application.getId())) {
                counted.add(analysis);
            }
        }

        int[] buckets = new int[10];
        Map<String, Long> missingCounts = new LinkedHashMap<>();
        for (ResumeMatchAnalysis analysis : counted) {
            buckets[Math.min(9, Math.max(0, analysis.getMatchScore()) / 10)]++;
            for (ScoredKeyword keyword : analysis.getMissingKeywords()) {
                missingCounts.merge(keyword.name(), 1L, Long::sum);
            }
        }

        List<MatchAnalyticsResponse.ScoreBucket> distribution = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            distribution.add(new MatchAnalyticsResponse.ScoreBucket(i * 10 + "-" + (i == 9 ? 100 : i * 10 + 9), buckets[i]));
        }
        List<MatchAnalyticsResponse.SkillCount> topMissing = missingCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .limit(10)
                .map(e -> new MatchAnalyticsResponse.SkillCount(e.getKey(), e.getValue()))
                .toList();

        List<MatchAnalyticsResponse.TopMatch> topMatches = counted.stream()
                .filter(analysis -> analysis.getJobApplication() != null)
                .sorted(Comparator.comparingInt(ResumeMatchAnalysis::getMatchScore).reversed())
                .limit(5)
                .map(analysis -> {
                    JobApplication application = analysis.getJobApplication();
                    return new MatchAnalyticsResponse.TopMatch(application.getId(), application.getCompanyName(),
                            application.getJobTitle(), application.getStatus(), analysis.getMatchScore());
                })
                .toList();

        return new MatchAnalyticsResponse(counted.size(), distribution, topMissing, topMatches);
    }

    /** Share of the posting's explicit skills the resume also names, 0-100. */
    public static int matchScore(int found, int total) {
        return total == 0 ? 0 : Math.round(100f * found / total);
    }

    private ResumeMatchAnalysis runAnalysis(UUID userId, Resume resume, String jobDescription,
                                             boolean includeBulletSuggestions) {
        // Self-healing: resumes uploaded before text extraction existed, or seeded directly
        // (see PreviewAccountSeeder), never got parsed_text populated. Rather than fail every
        // analysis on them forever, try extracting on the spot - this costs nothing extra for
        // the normal case where parsed_text is already there (see ResumeService.ensureParsedText).
        resume = resumeService.ensureParsedText(resume);
        if (resume.getParsedText() == null || resume.getParsedText().isBlank()) {
            throw new AiServiceException(
                    "This resume's text couldn't be extracted (likely a scanned/image-only PDF, or a " +
                            "placeholder file with no real content) — re-upload a text-based PDF or Word " +
                            "document to analyze it.");
        }

        List<ScoredKeyword> jdKeywords = skillExtractionService.extract(jobDescription);
        List<ScoredKeyword> resumeKeywords = skillExtractionService.extract(resume.getParsedText());
        Map<Boolean, List<ScoredKeyword>> explicit = skillExtractionService.splitByPresence(jdKeywords, resumeKeywords);
        List<ScoredKeyword> foundInResume = explicit.get(true);

        ClaudeClient.AnalysisResult aiResult = claudeClient.analyzeMatch(
                jobDescription, jdKeywords, resumeKeywords, includeBulletSuggestions);

        Map<Boolean, List<ScoredKeyword>> predicted = aiResult.predictedKeywords().stream()
                .collect(Collectors.partitioningBy(ClaudeClient.PredictedKeyword::foundInResume,
                        Collectors.mapping(k -> new ScoredKeyword(k.name(), k.weight()), Collectors.toList())));

        int matchScore = matchScore(foundInResume.size(), jdKeywords.size());

        User user = userService.getById(userId);
        ResumeMatchAnalysis analysis = ResumeMatchAnalysis.builder()
                .user(user)
                .resume(resume)
                .matchScore(matchScore)
                .scoreRationale(aiResult.scoreRationale())
                .build();
        analysis.setJobDescriptionKeywords(jdKeywords);
        analysis.setFoundKeywords(foundInResume);
        analysis.setMissingKeywords(explicit.get(false));
        analysis.setPredictedFoundKeywords(predicted.get(true));
        analysis.setPredictedMissingKeywords(predicted.get(false));
        analysis.setSuggestedResumeBullets(aiResult.suggestedResumeBullets());
        return analysis;
    }
}
