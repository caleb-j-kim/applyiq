package com.applyiq.email;

import com.applyiq.applications.ApplicationStatus;
import com.applyiq.applications.JobApplication;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EmailClassifierTest {

    private static InboxClient.EmailMessage mail(String fromName, String from, String subject, String body) {
        return new InboxClient.EmailMessage(fromName, from, subject, body, Instant.now());
    }

    @Test
    void rejectionWinsOverPoliteThankYou() {
        var m = mail("Stripe Recruiting", "no-reply@stripe.com", "Your application",
                "Thank you for applying. Unfortunately we have decided not to move forward with your application.");
        assertEquals(Optional.of(EmailClassifier.Kind.REJECTION), EmailClassifier.classify(m));
    }

    @Test
    void classifiesInterviewAndConfirmation() {
        assertEquals(Optional.of(EmailClassifier.Kind.INTERVIEW), EmailClassifier.classify(
                mail("Jane", "jane@acme.com", "Next steps", "We'd like to schedule an interview with you.")));
        assertEquals(Optional.of(EmailClassifier.Kind.APPLICATION_RECEIVED), EmailClassifier.classify(
                mail("Acme Careers", "jobs@acme.com", "Thanks for applying", "We received your application.")));
        assertEquals(Optional.empty(), EmailClassifier.classify(
                mail("LinkedIn", "jobs@linkedin.com", "Job alert: 20 new jobs", "Thank you for applying")));
    }

    @Test
    void recognizesLinkedInEasyApplyConfirmation() {
        var m = mail("LinkedIn", "jobs-noreply@linkedin.com", "Caleb, your application was sent to CVector",
                "Your application was sent to CVector. Recommended jobs for you: ...");
        assertEquals(Optional.of(EmailClassifier.Kind.APPLICATION_RECEIVED), EmailClassifier.classify(m));
        assertEquals("CVector", EmailClassifier.extract(m).orElseThrow().companyName());
    }

    @Test
    void matchesCompanyAsWholeWordOnly() {
        JobApplication meta = JobApplication.builder().companyName("Meta").jobTitle("SWE").status(ApplicationStatus.APPLIED).build();
        JobApplication acme = JobApplication.builder().companyName("Acme").jobTitle("SWE").status(ApplicationStatus.APPLIED).build();
        var m = mail("Acme Talent", "talent@acme.com", "Interview", "Some metadata about the role.");
        assertEquals(Optional.of(acme), EmailClassifier.match(m, List.of(meta, acme)));
    }

    @Test
    void extractsCompanyAndTitleFromConfirmation() {
        var viaAts = mail("Datadog Recruiting via Greenhouse", "no-reply@greenhouse.io",
                "Thank you for applying to Datadog", "We received your application for the Software Engineer Intern position.");
        assertEquals(Optional.of(new EmailClassifier.NewApplication("Datadog", "Software Engineer Intern")), EmailClassifier.extract(viaAts));

        var direct = mail("Careers", "careers@palantir.com", "Application received", "Thanks for applying!");
        assertEquals(Optional.of(new EmailClassifier.NewApplication("Palantir", "Unknown role")), EmailClassifier.extract(direct));
    }
}
