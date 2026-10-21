package com.applyiq.ai;

import com.applyiq.applications.JobApplication;
import com.applyiq.applications.JobApplicationService;
import com.applyiq.common.exception.AiServiceException;
import com.applyiq.common.exception.ResourceNotFoundException;
import com.applyiq.resumes.Resume;
import com.applyiq.resumes.ResumeService;
import com.applyiq.users.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Interview prep generation (not saved) and saving/listing/editing. Claude writes every section
 * except Company Research, which {@link CompanyResearchService} builds from public sources. The prompt is a condensed,
 * candidate-neutral version of .claude/skills/caleb-custom/SKILL.md: the candidate's evidence
 * comes from the selected resume, never from a hardcoded profile.
 */
@Service
@RequiredArgsConstructor
public class InterviewPrepService {

    private static final String FEATURE = "Interview prep";
    static final String COMPANY_RESEARCH = "Company Research";

    private static final String SYSTEM_PROMPT = """
            You write candidate-specific interview preparation guides for ApplyIQ, a job application \
            tracker. You get a job posting, the candidate's resume text, any known interviewer details, \
            and the exact list of section titles to produce. The guide must be useful to study from \
            immediately: direct, practical language, short bullets, and ready-to-say answers where useful. \
            No motivational filler.

            Truthfulness:
            - Use only facts present in the resume. Never invent employment, projects, metrics, \
            technologies, education or accomplishments.
            - Label fit per requirement as one of: Strong match, Good match, Partial match, \
            Transferable experience, Gap.
            - For a gap: name the closest transferable experience, what not to claim, an honest \
            interview-ready answer, and what to review before the interview.
            - Map qualifications to the specific resume projects/roles that best prove them, choosing \
            the strongest evidence for this posting rather than repeating every project.
            - About the company: use only what the posting says plus widely known, stable facts. Do not \
            state unverifiable specifics (headcount, recent news, team names) as fact.
            - Interviewer Information: list the name and email exactly as given, then any title or \
            background ONLY if supplied. If nothing beyond name/email is known, say what to look up \
            (current title, previous roles, education, a talking point) instead of guessing.

            What each section covers (use whichever appear in the requested list):
            - Qualifications: every meaningful required and preferred qualification, its fit label, \
            supporting evidence, and gap answers.
            - Clarifying Questions / Interview Approach: clarify requirements and edge cases, brute force \
            first, state complexity, optimize, talk while coding, test.
            - Data Structures Recap: only structures likely to matter for this role, each with when to use \
            it and its key complexities.
            - Key Points: what the role fundamentally is, top technical and collaboration focus areas, \
            best positioning, the top three pieces of evidence, and a spoken "why this company/role" answer.
            - Biggest Gaps — and How to Answer Them: the highest-risk gaps with truthful answers.
            - Knowledge: the topics most likely to be tested, drawn from the posting, each with what to \
            know, a likely question and a concise strong answer.
            - Behavioral Stories to Prepare: which resume experience answers which prompts (ownership, \
            ambiguity, conflict, failure, learning, collaboration) and what to emphasize.
            - Likely Questions / Likely Recruiter Questions / Likely Technical / Hiring Manager \
            Questions: realistic questions from the posting, each with preparation notes or an answer.
            - Technical Scenario Questions: troubleshooting/design scenarios from the role's domain with \
            an investigation path; don't imply experience at a scale the resume doesn't show.
            - Interview Strategy / Coding Interview Strategy: prioritized topics, likely languages, and \
            communication/testing approach (or the relevant non-coding strategy if coding is unlikely).
            - Questions to Ask / Questions for the Recruiter / Questions for the Hiring Manager: \
            specific, non-redundant questions not already answered by the posting.
            - Interview Notes Placeholders: one bullet per expected round, e.g. "Interview with \
            Recruiter:" and "Technical Interview with Manager:".

            Output: return the sections in exactly the requested order with exactly the requested \
            titles. Each bullet is one plain-text line (no markdown headings or nested lists); put a \
            question and its answer in the same bullet as "Q: ... A: ...".
            """;

    private static final String SCHEMA_JSON = """
            {
              "type": "object",
              "additionalProperties": false,
              "required": ["sections"],
              "properties": {
                "sections": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["title", "bullets"],
                    "properties": {
                      "title": {"type": "string"},
                      "bullets": {"type": "array", "items": {"type": "string"}}
                    }
                  }
                }
              }
            }
            """;

    private static final JsonNode SCHEMA = readSchema();

    private final ClaudeClient claudeClient;
    private final InterviewPrepRepository repository;
    private final JobApplicationService jobApplicationService;
    private final ResumeService resumeService;
    private final UserService userService;
    private final CompanyResearchService companyResearchService;

    public InterviewPrepResponse generate(UUID userId, UUID applicationId, InterviewPrepRequest request) {
        JobApplication application = jobApplicationService.getOwned(userId, applicationId);
        if (application.getJobDescription() == null || application.getJobDescription().isBlank()) {
            throw new AiServiceException("This application has no job description to prepare from.");
        }
        Resume resume = resumeService.ensureParsedText(resumeService.getOwned(userId, request.resumeId()));
        if (resume.getParsedText() == null || resume.getParsedText().isBlank()) {
            throw new AiServiceException("This resume's text couldn't be extracted — re-upload a text-based PDF or Word document.");
        }

        PrepEffort effort = request.effort();
        List<String> titles = effort.sections.lines().toList();
        int researchIndex = titles.indexOf(COMPANY_RESEARCH);
        // Scraping takes a few seconds; run it while Claude writes the rest.
        CompletableFuture<List<String>> research = researchIndex < 0 ? null : CompletableFuture.supplyAsync(
                () -> companyResearchService.research(application.getCompanyName(), application.getJobUrl()));
        String aiTitles = titles.stream().filter(t -> !t.equals(COMPANY_RESEARCH)).collect(Collectors.joining("\n"));

        JsonNode result = claudeClient.generateJson(SYSTEM_PROMPT, buildUserTurn(application, resume, effort, aiTitles),
                SCHEMA, "adaptive", effort.apiEffort, effort.maxTokens, FEATURE);

        List<InterviewPrepResponse.Section> sections = new ArrayList<>();
        for (JsonNode section : result.path("sections")) {
            List<String> bullets = new ArrayList<>();
            section.path("bullets").forEach(b -> bullets.add(b.asText()));
            sections.add(new InterviewPrepResponse.Section(section.path("title").asText(), bullets));
        }
        if (sections.isEmpty()) {
            throw new AiServiceException(FEATURE + " came back empty. Please try again.");
        }
        if (research != null) {
            sections.add(Math.min(researchIndex, sections.size()),
                    new InterviewPrepResponse.Section(COMPANY_RESEARCH, research.join()));
        }
        // createdAt is set now (not left null) so an unsaved prep shows its real generation time.
        return new InterviewPrepResponse(null, application.getId(), application.getCompanyName(),
                application.getJobTitle(), resume.getFileName(), effort, sections, Instant.now());
    }

    @Transactional
    public InterviewPrepResponse save(UUID userId, InterviewPrepResponse prep) {
        JobApplication application = prep.jobApplicationId() == null
                ? null
                : jobApplicationService.getOwned(userId, prep.jobApplicationId());
        InterviewPrep entity = InterviewPrep.builder()
                .user(userService.getById(userId))
                .jobApplication(application)
                .companyName(prep.companyName())
                .jobTitle(prep.jobTitle())
                .resumeName(prep.resumeName())
                .effort(prep.effort())
                .build();
        entity.setSections(prep.sections());
        return InterviewPrepResponse.from(repository.save(entity));
    }

    /** Replaces a saved prep's sections (titles and bullets) with the user's edits. */
    @Transactional
    public InterviewPrepResponse update(UUID userId, UUID prepId, InterviewPrepResponse prep) {
        InterviewPrep entity = repository.findByIdAndUser_Id(prepId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview prep not found"));
        entity.setSections(prep.sections());
        return InterviewPrepResponse.from(entity);
    }

    @Transactional(readOnly = true)
    public List<InterviewPrepResponse> list(UUID userId) {
        return repository.findByUser_IdOrderByCreatedAtDesc(userId).stream().map(InterviewPrepResponse::from).toList();
    }

    private static String buildUserTurn(JobApplication application, Resume resume, PrepEffort effort, String titles) {
        return """
                Company: %s
                Role: %s
                Location: %s

                Interviewer: %s
                Interviewer email: %s

                Job description:
                %s

                Candidate resume:
                %s

                Produce these sections, in this order, with these exact titles (%s effort):
                %s
                """.formatted(
                application.getCompanyName(),
                application.getJobTitle(),
                Objects.requireNonNullElse(application.getLocation(), "(not given)"),
                Objects.requireNonNullElse(application.getRecruiterName(), "(unknown)"),
                Objects.requireNonNullElse(application.getRecruiterEmail(), "(unknown)"),
                JdTextCleaner.clean(application.getJobDescription()),
                resume.getParsedText(),
                effort.label(),
                titles);
    }

    private static JsonNode readSchema() {
        try {
            return new ObjectMapper().readTree(SCHEMA_JSON);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
