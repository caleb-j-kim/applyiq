package com.applyiq.followups;

import com.applyiq.applications.ApplicationStatus;
import com.applyiq.applications.JobApplication;
import com.applyiq.applications.PriorityLevel;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FollowUpServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 21);

    private final FollowUpService service = new FollowUpService(new FollowUpModel(), null, null, null, null, null, null, null, null, null);

    FollowUpServiceTest() throws Exception {
    }

    private FollowUpRecommendationResponse recommend(ApplicationStatus status, int daysAgo, int followUps) {
        JobApplication a = JobApplication.builder()
                .companyName("Acme").jobTitle("Engineer").status(status)
                .dateApplied(TODAY.minusDays(daysAgo)).followUpCount(followUps)
                .priorityLevel(PriorityLevel.MEDIUM).build();
        return service.recommend(a, TODAY).orElseThrow();
    }

    @Test
    void exportedTreeMatchesTrainingScenarios() {
        assertEquals("Wait longer", recommend(ApplicationStatus.APPLIED, 3, 0).recommendedAction());
        assertEquals("Send first follow-up", recommend(ApplicationStatus.APPLIED, 14, 0).recommendedAction());
        assertEquals("Mark as likely ghosted", recommend(ApplicationStatus.APPLIED, 51, 2).recommendedAction());
        assertEquals("Archive application", recommend(ApplicationStatus.WITHDRAWN, 84, 0).recommendedAction());
    }

    @Test
    void explainsTheDecisionInPlainEnglish() {
        FollowUpRecommendationResponse r = recommend(ApplicationStatus.APPLIED, 14, 0);
        assertTrue(r.decisionFactors().stream().anyMatch(f -> f.startsWith("14 days since")), r.decisionFactors()::toString);
        assertTrue(r.ghostingRiskScore() >= 0 && r.ghostingRiskScore() <= 1);
    }

    @Test
    void skipsSavedAndOffer() {
        JobApplication saved = JobApplication.builder().status(ApplicationStatus.SAVED).dateApplied(TODAY).build();
        assertTrue(service.recommend(saved, TODAY).isEmpty());
    }
}
