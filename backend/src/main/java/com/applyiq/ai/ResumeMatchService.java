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

import java.util.List;
import java.util.UUID;

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
        List<ScoredKeyword> foundInResume = skillExtractionService.intersect(jdKeywords, resumeKeywords);
        List<ScoredKeyword> missed = skillExtractionService.difference(jdKeywords, resumeKeywords);

        ClaudeClient.AnalysisResult aiResult = claudeClient.analyzeMatch(
                jobDescription, jdKeywords, resumeKeywords, includeBulletSuggestions);

        List<ScoredKeyword> predictedFound = aiResult.predictedKeywords().stream()
                .filter(ClaudeClient.PredictedKeyword::foundInResume)
                .map(k -> new ScoredKeyword(k.name(), k.weight()))
                .toList();
        List<ScoredKeyword> predictedMissed = aiResult.predictedKeywords().stream()
                .filter(k -> !k.foundInResume())
                .map(k -> new ScoredKeyword(k.name(), k.weight()))
                .toList();

        int matchScore = jdKeywords.isEmpty() ? 0 : Math.round(100f * foundInResume.size() / jdKeywords.size());

        User user = userService.getById(userId);
        ResumeMatchAnalysis analysis = ResumeMatchAnalysis.builder()
                .user(user)
                .resume(resume)
                .matchScore(matchScore)
                .scoreRationale(aiResult.scoreRationale())
                .build();
        analysis.setJobDescriptionKeywords(jdKeywords);
        analysis.setFoundKeywords(foundInResume);
        analysis.setMissingKeywords(missed);
        analysis.setPredictedFoundKeywords(predictedFound);
        analysis.setPredictedMissingKeywords(predictedMissed);
        analysis.setSuggestedResumeBullets(aiResult.suggestedResumeBullets());
        return analysis;
    }
}
