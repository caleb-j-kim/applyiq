package com.applyiq.email;

import com.applyiq.applications.JobApplication;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Decides what a recruiting email means and which application it belongs to.
 *
 * ponytail: phrase lists + regex, no LLM — free, instant and predictable, but it will miss
 * unusually-worded emails and can mis-extract company/title on confirmations. Upgrade path is a
 * small Claude classification call (ai.ClaudeClient) on messages that pass a cheap keyword prefilter.
 */
final class EmailClassifier {

    enum Kind { REJECTION, INTERVIEW, APPLICATION_RECEIVED }

    record NewApplication(String companyName, String jobTitle) {
    }

    // Checked in this order: rejections often also say "thank you for applying", and
    // "not moving forward" contains "moving forward", so the negative case must win first.
    private static final List<String> REJECTION = List.of(
            "not to move forward", "not moving forward", "not be moving forward", "won't be moving forward",
            "move forward with other candidates", "pursue other candidates", "decided to proceed with other",
            "unable to offer you", "not been selected", "were not selected", "position has been filled",
            "regret to inform", "no longer under consideration", "decided not to proceed", "not be proceeding");
    private static final List<String> INTERVIEW = List.of(
            "schedule an interview", "schedule a call", "interview invitation", "invite you to interview",
            "invitation to interview", "like to invite you", "phone screen", "availability for an interview",
            "set up a time to chat", "next round", "technical interview", "move you forward",
            "moving forward with your application", "schedule your interview");
    private static final List<String> RECEIVED = List.of(
            "thank you for applying", "thanks for applying", "application has been received",
            "received your application", "application was received", "thank you for your application",
            "application has been submitted", "application was submitted", "we have received your application",
            "your application was sent to"); // LinkedIn Easy Apply
    private static final List<String> IGNORE = List.of("job alert", "jobs you may be interested in", "recommended jobs");

    // Applicant-tracking systems send on a company's behalf, so their domain says nothing about the employer.
    private static final Set<String> ATS_DOMAINS = Set.of("greenhouse", "lever", "myworkday", "myworkdayjobs",
            "workday", "ashbyhq", "smartrecruiters", "icims", "jobvite", "taleo", "successfactors", "gmail",
            "outlook", "linkedin", "indeed", "handshake", "joinhandshake");
    private static final Pattern SENDER_NOISE = Pattern.compile(
            "(?i)\\b(careers?|recruiting|recruitment|talent( acquisition)?|hiring( team)?|jobs|hr|team|no-?reply|notifications?|via \\w+)\\b");
    private static final Pattern COMPANY = Pattern.compile(
            "(?:applying|application|applied)(?: was sent)? (?:to|at|with) ([A-Z][\\w&.'-]*(?: [A-Z&][\\w&.'-]*){0,3})");
    private static final Pattern TITLE = Pattern.compile(
            "(?i)(?:application for|applying for|applied for|interest in)(?: the| our)? (.{3,80}?)(?: position| role| job| opening|,| at | with |[.!\\n])");

    private EmailClassifier() {
    }

    static Optional<Kind> classify(InboxClient.EmailMessage m) {
        // Job-alert digests are recognized by subject only: LinkedIn puts "Recommended jobs" footers in
        // every email, including real "your application was sent" confirmations.
        if (containsAny(m.subject().toLowerCase(Locale.ROOT), IGNORE)) return Optional.empty();
        String text = (m.subject() + "\n" + m.body()).toLowerCase(Locale.ROOT);
        if (containsAny(text, REJECTION)) return Optional.of(Kind.REJECTION);
        if (containsAny(text, INTERVIEW)) return Optional.of(Kind.INTERVIEW);
        if (containsAny(text, RECEIVED)) return Optional.of(Kind.APPLICATION_RECEIVED);
        return Optional.empty();
    }

    /** The application this email is about: company named in it (whole word), title as tie-breaker, newest first. */
    static Optional<JobApplication> match(InboxClient.EmailMessage m, List<JobApplication> applications) {
        String text = (m.fromName() + " " + m.fromAddress() + " " + m.subject() + " " + m.body()).toLowerCase(Locale.ROOT);
        return applications.stream()
                .filter(a -> mentions(text, a.getCompanyName()))
                .max(Comparator.<JobApplication>comparingInt(a -> mentions(text, a.getJobTitle()) ? 1 : 0)
                        .thenComparing(a -> a.getCreatedAt() == null ? java.time.Instant.EPOCH : a.getCreatedAt()));
    }

    /** Company + title for an application confirmation that matches nothing tracked yet; empty if no company is found. */
    static Optional<NewApplication> extract(InboxClient.EmailMessage m) {
        String text = m.subject() + "\n" + m.body();
        String company = firstGroup(COMPANY, text);
        if (company == null) company = companyFromSender(m);
        if (company == null) return Optional.empty();
        String title = firstGroup(TITLE, text);
        return Optional.of(new NewApplication(company, title != null ? title : "Unknown role"));
    }

    // Sender domain first (jobs@careers.acme.com -> Acme); the display name is the fallback for
    // ATS-sent mail ("Acme Recruiting via Greenhouse"), since it may also be a recruiter's own name.
    private static String companyFromSender(InboxClient.EmailMessage m) {
        int at = m.fromAddress().indexOf('@');
        String[] labels = at < 0 ? new String[0] : m.fromAddress().substring(at + 1).split("\\.");
        if (labels.length >= 2 && !ATS_DOMAINS.contains(labels[labels.length - 2])) {
            String org = labels[labels.length - 2];
            return Character.toUpperCase(org.charAt(0)) + org.substring(1);
        }
        String name = SENDER_NOISE.matcher(m.fromName()).replaceAll("").replaceAll("[|,@-]+", " ").trim();
        return name.isBlank() || ATS_DOMAINS.contains(name.toLowerCase(Locale.ROOT)) ? null : name;
    }

    private static boolean mentions(String lowerText, String phrase) {
        if (phrase == null || phrase.isBlank()) return false;
        return Pattern.compile("\\b" + Pattern.quote(phrase.toLowerCase(Locale.ROOT).trim()) + "\\b").matcher(lowerText).find();
    }

    private static boolean containsAny(String text, List<String> phrases) {
        return phrases.stream().anyMatch(text::contains);
    }

    private static String firstGroup(Pattern p, String text) {
        Matcher matcher = p.matcher(text);
        return matcher.find() ? matcher.group(1).trim() : null;
    }
}
