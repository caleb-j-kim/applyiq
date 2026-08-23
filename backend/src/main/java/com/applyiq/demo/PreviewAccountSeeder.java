package com.applyiq.demo;

import com.applyiq.applications.ApplicationStatus;
import com.applyiq.applications.JobApplication;
import com.applyiq.applications.JobApplicationRepository;
import com.applyiq.applications.PriorityLevel;
import com.applyiq.resumes.Resume;
import com.applyiq.resumes.ResumeRepository;
import com.applyiq.storage.ResumeStorageService;
import com.applyiq.users.User;
import com.applyiq.users.UserRepository;
import com.applyiq.users.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Arrays;

/**
 * Seeds the marketing site's "View demo dashboard" account with a fixed set of sample
 * applications and resumes, on every startup. Unlike DemoDataSeeder, this always wipes and
 * re-creates that account's applications/resumes (never just the user row) so that anything
 * a visitor adds/edits during a running session is reset the next time the backend restarts —
 * but persists normally while the backend keeps running, including across logout/login.
 * Controlled by app.demo.enabled (env var DEMO_SEED_ENABLED), same flag as DemoDataSeeder.
 */
@Component
@RequiredArgsConstructor
public class PreviewAccountSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PreviewAccountSeeder.class);

    private final UserRepository userRepository;
    private final UserService userService;
    private final JobApplicationRepository jobApplicationRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeStorageService resumeStorageService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo.enabled:true}")
    private boolean enabled;

    @Value("${app.preview.email:caleb.kim@applyiq.com}")
    private String previewEmail;

    @Value("${app.preview.password:demo1234}")
    private String previewPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }

        User user = userRepository.findByEmail(previewEmail)
                .orElseGet(() -> userService.createUser("Caleb", "Kim", previewEmail, passwordEncoder.encode(previewPassword)));

        jobApplicationRepository.deleteAllByUser_Id(user.getId());
        resumeRepository.findAllByUser_Id(user.getId())
                .forEach(resume -> resumeStorageService.delete(resume.getStorageKey()));
        resumeRepository.deleteAllByUser_Id(user.getId());

        jobApplicationRepository.saveAll(sampleApplications(user));
        resumeRepository.saveAll(sampleResumes(user));

        log.info("Reset preview account: {} (password set via PREVIEW_PASSWORD)", previewEmail);
    }

    private List<JobApplication> sampleApplications(User user) {
        return Arrays.asList(
                JobApplication.builder().user(user)
                        .companyName("Capital One").jobTitle("Software Engineer Intern").location("McLean, VA")
                        .jobUrl("https://capitalone.com/careers/123").status(ApplicationStatus.INTERVIEWING)
                        .source("Company Website").dateApplied(LocalDate.parse("2026-07-05"))
                        .lastContactDate(LocalDate.parse("2026-07-22")).hasReferral(true)
                        .referralName("John Smith").referralRelationship("Former coworker")
                        .referralContactInfo("john.smith@capitalone.com").referralDate(LocalDate.parse("2026-07-04"))
                        .referralNotes("Referred into the platform engineering team.")
                        .recruiterName("Alicia Reyes").recruiterEmail("alicia.reyes@capitalone.com")
                        .priorityLevel(PriorityLevel.HIGH)
                        .jobDescription("Build and maintain secure REST APIs using Java, Spring Boot, and PostgreSQL.")
                        .notes("Final round scheduled for next week.").followUpCount(1).build(),

                JobApplication.builder().user(user)
                        .companyName("Google").jobTitle("Software Engineer Intern").location("Mountain View, CA")
                        .status(ApplicationStatus.APPLIED).source("LinkedIn").dateApplied(LocalDate.parse("2026-07-19"))
                        .hasReferral(false).priorityLevel(PriorityLevel.HIGH).followUpCount(0).build(),

                JobApplication.builder().user(user)
                        .companyName("Stripe").jobTitle("Backend Engineer").location("Remote")
                        .status(ApplicationStatus.ONLINE_ASSESSMENT).source("Referral")
                        .dateApplied(LocalDate.parse("2026-07-14")).lastContactDate(LocalDate.parse("2026-07-20"))
                        .hasReferral(true).referralName("Maya Chen").referralRelationship("College friend")
                        .referralContactInfo("maya.chen@stripe.com").referralDate(LocalDate.parse("2026-07-13"))
                        .priorityLevel(PriorityLevel.MEDIUM).followUpCount(0).build(),

                JobApplication.builder().user(user)
                        .companyName("Deloitte").jobTitle("Technology Consultant").location("Arlington, VA")
                        .status(ApplicationStatus.APPLIED).source("Handshake").dateApplied(LocalDate.parse("2026-07-01"))
                        .hasReferral(false).priorityLevel(PriorityLevel.LOW).followUpCount(0).build(),

                JobApplication.builder().user(user)
                        .companyName("Microsoft").jobTitle("Product Manager Intern").location("Redmond, WA")
                        .status(ApplicationStatus.FINAL_ROUND).source("Company Website")
                        .dateApplied(LocalDate.parse("2026-06-20")).lastContactDate(LocalDate.parse("2026-07-21"))
                        .hasReferral(false).priorityLevel(PriorityLevel.HIGH).followUpCount(2).build(),

                JobApplication.builder().user(user)
                        .companyName("Booz Allen Hamilton").jobTitle("Java Developer").location("Rockville, MD")
                        .status(ApplicationStatus.GHOSTED).source("Indeed").dateApplied(LocalDate.parse("2026-06-01"))
                        .lastContactDate(LocalDate.parse("2026-06-10")).hasReferral(false)
                        .priorityLevel(PriorityLevel.MEDIUM).followUpCount(2).build(),

                JobApplication.builder().user(user)
                        .companyName("Fintasy").jobTitle("Full-Stack Engineer").location("Remote")
                        .status(ApplicationStatus.OFFER).source("Referral").dateApplied(LocalDate.parse("2026-06-15"))
                        .lastContactDate(LocalDate.parse("2026-07-25")).hasReferral(true)
                        .referralName("Priya Nair").referralRelationship("Former teammate")
                        .referralContactInfo("priya@fintasy.io").referralDate(LocalDate.parse("2026-06-14"))
                        .priorityLevel(PriorityLevel.HIGH).followUpCount(1).build(),

                JobApplication.builder().user(user)
                        .companyName("JPMorgan Chase").jobTitle("Software Engineer Intern").location("Jersey City, NJ")
                        .status(ApplicationStatus.REJECTED).source("Company Website")
                        .dateApplied(LocalDate.parse("2026-05-28")).lastContactDate(LocalDate.parse("2026-06-12"))
                        .hasReferral(false).priorityLevel(PriorityLevel.MEDIUM).followUpCount(1).build(),

                JobApplication.builder().user(user)
                        .companyName("Palantir").jobTitle("Forward Deployed Engineer").location("Washington, DC")
                        .status(ApplicationStatus.SAVED).source("Company Website")
                        .dateApplied(LocalDate.parse("2026-07-27")).hasReferral(false)
                        .priorityLevel(PriorityLevel.MEDIUM).followUpCount(0).build(),

                JobApplication.builder().user(user)
                        .companyName("Amazon").jobTitle("SDE Intern").location("Seattle, WA")
                        .status(ApplicationStatus.APPLIED).source("University Career Fair")
                        .dateApplied(LocalDate.parse("2026-07-08")).hasReferral(false)
                        .priorityLevel(PriorityLevel.MEDIUM).followUpCount(0).build(),

                JobApplication.builder().user(user)
                        .companyName("Northrop Grumman").jobTitle("Software Engineer").location("Fairfax, VA")
                        .status(ApplicationStatus.WITHDRAWN).source("Handshake")
                        .dateApplied(LocalDate.parse("2026-05-10")).hasReferral(false)
                        .priorityLevel(PriorityLevel.LOW).followUpCount(0).build(),

                JobApplication.builder().user(user)
                        .companyName("Datadog").jobTitle("Backend Engineer Intern").location("New York, NY")
                        .status(ApplicationStatus.APPLIED).source("LinkedIn").dateApplied(LocalDate.parse("2026-07-21"))
                        .hasReferral(false).priorityLevel(PriorityLevel.MEDIUM).followUpCount(0).build()
        );
    }

    private List<Resume> sampleResumes(User user) {
        return Arrays.asList(
                seededResume(user, "Caleb_Kim_Resume_2026.pdf", true, placeholderPdf(142)),
                seededResume(user, "Caleb_Kim_Resume_SWE_Intern.pdf", false, placeholderPdf(138)),
                seededResume(user, "Caleb_Kim_Resume_DataFocus.pdf", false, placeholderPdf(151))
        );
    }

    private Resume seededResume(User user, String fileName, boolean active, byte[] content) {
        String storageKey = resumeStorageService.newKey(user.getId());
        resumeStorageService.upload(storageKey, content, "application/pdf");
        return Resume.builder().user(user).fileName(fileName)
                .contentType("application/pdf").active(active)
                .storageKey(storageKey).fileSizeBytes(content.length).build();
    }

    private byte[] placeholderPdf(int targetSizeKb) {
        String header = "%PDF-1.4\n"
                + "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                + "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                + "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n";
        String footer = "trailer<</Size 4/Root 1 0 R>>\n%%EOF\n";
        int targetBytes = targetSizeKb * 1024;
        int fillerLength = Math.max(0, targetBytes - header.length() - footer.length() - 4);
        StringBuilder filler = new StringBuilder("%").append("~".repeat(fillerLength)).append("\n");
        return (header + filler + footer).getBytes();
    }
}
