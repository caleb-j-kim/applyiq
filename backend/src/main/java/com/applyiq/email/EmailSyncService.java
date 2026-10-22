package com.applyiq.email;

import com.applyiq.applications.ApplicationStatus;
import com.applyiq.applications.JobApplication;
import com.applyiq.applications.JobApplicationRepository;
import com.applyiq.applications.JobApplicationService;
import com.applyiq.applications.PriorityLevel;
import com.applyiq.notifications.NotificationCreateRequest;
import com.applyiq.notifications.NotificationService;
import com.applyiq.notifications.NotificationType;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * The email automation: reads new mail from every linked inbox and
 * <ul>
 *   <li>moves an application to Rejected / Interviewing when a matching rejection or interview email arrives</li>
 *   <li>adds a new Applied application when an "application received" confirmation matches nothing tracked</li>
 * </ul>
 * Each half is gated by its toggle on the connection, and every change raises a notification.
 */
@Service
@RequiredArgsConstructor
public class EmailSyncService {

    private static final Logger log = LoggerFactory.getLogger(EmailSyncService.class);

    // An interview email shouldn't drag an application backwards from a later stage or a closed one.
    private static final Set<ApplicationStatus> CAN_BECOME_INTERVIEWING = EnumSet.of(
            ApplicationStatus.SAVED, ApplicationStatus.APPLIED, ApplicationStatus.ONLINE_ASSESSMENT, ApplicationStatus.GHOSTED);
    private static final Set<ApplicationStatus> CLOSED = EnumSet.of(
            ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN, ApplicationStatus.OFFER);

    private final EmailConnectionRepository connectionRepository;
    private final EmailOAuthService oauthService;
    private final InboxClient inboxClient;
    private final JobApplicationService jobApplicationService;
    private final JobApplicationRepository jobApplicationRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelayString = "${app.email.sync-interval-ms:900000}", initialDelay = 60_000)
    public void syncAll() {
        for (EmailConnection connection : connectionRepository.findAll()) {
            try {
                sync(connection);
            } catch (Exception e) {
                // One revoked/broken inbox must not stop everyone else's sync.
                log.warn("Email sync failed for connection {} ({}): {}", connection.getId(), connection.getProvider(), e.getMessage());
            }
        }
    }

    /** Returns how many applications were changed or created. */
    public int sync(EmailConnection connection) {
        Instant startedAt = Instant.now();
        List<InboxClient.EmailMessage> messages = new ArrayList<>(inboxClient.fetchSince(
                oauthService.accessToken(connection), connection.getLastSyncedAt()));
        messages.sort(Comparator.comparing(InboxClient.EmailMessage::receivedAt));

        UUID userId = connection.getUser().getId();
        List<JobApplication> applications = new ArrayList<>(jobApplicationService.list(userId, null, null));
        int changes = 0;
        log.debug("Email sync for connection {}: {} new message(s) since {}", connection.getId(), messages.size(), connection.getLastSyncedAt());
        for (InboxClient.EmailMessage message : messages) {
            Optional<EmailClassifier.Kind> kind = EmailClassifier.classify(message);
            // Debug only (subjects are personal data): enable with LOGGING_LEVEL_COM_APPLYIQ_EMAIL=DEBUG.
            log.debug("  [{}] from {} \"{}\"", kind.map(Enum::name).orElse("ignored"), message.fromAddress(), message.subject());
            if (kind.isEmpty()) continue;
            boolean changed = apply(connection, kind.get(), message, applications);
            log.debug("    -> {}", changed ? "applied" : "no change");
            if (changed) changes++;
        }

        connection.setLastSyncedAt(startedAt);
        connectionRepository.save(connection);
        return changes;
    }

    private boolean apply(EmailConnection connection, EmailClassifier.Kind kind, InboxClient.EmailMessage message,
                          List<JobApplication> applications) {
        UUID userId = connection.getUser().getId();
        LocalDate received = LocalDate.ofInstant(message.receivedAt(), ZoneId.systemDefault());
        JobApplication match = EmailClassifier.match(message, applications).orElse(null);

        if (kind == EmailClassifier.Kind.APPLICATION_RECEIVED) {
            if (!connection.isAutoAddApplications()) return false;
            if (match == null) {
                return EmailClassifier.extract(message).map(found -> {
                    JobApplication created = jobApplicationRepository.save(JobApplication.builder()
                            .user(connection.getUser())
                            .companyName(found.companyName())
                            .jobTitle(found.jobTitle())
                            .status(ApplicationStatus.APPLIED)
                            .source("Email")
                            .dateApplied(received)
                            .priorityLevel(PriorityLevel.MEDIUM)
                            .notes("Added automatically from a confirmation email: \"" + message.subject() + "\"")
                            .build());
                    applications.add(created);
                    notify(userId, created, "Application added from email",
                            "Added " + created.getJobTitle() + " at " + created.getCompanyName() + " from a confirmation email.");
                    return true;
                }).orElse(false);
            }
            if (match.getStatus() != ApplicationStatus.SAVED) return false;
            match.setDateApplied(received);
            return changeStatus(userId, match, ApplicationStatus.APPLIED, received, "a confirmation email");
        }

        if (match == null || !connection.isAutoUpdateStatus()) return false;
        if (kind == EmailClassifier.Kind.REJECTION && !CLOSED.contains(match.getStatus())) {
            return changeStatus(userId, match, ApplicationStatus.REJECTED, received, "a rejection email");
        }
        if (kind == EmailClassifier.Kind.INTERVIEW && CAN_BECOME_INTERVIEWING.contains(match.getStatus())) {
            return changeStatus(userId, match, ApplicationStatus.INTERVIEWING, received, "an interview invitation");
        }
        // Already past this point — still counts as hearing back, which the follow-up model uses.
        match.setLastContactDate(received);
        jobApplicationRepository.save(match);
        return false;
    }

    private boolean changeStatus(UUID userId, JobApplication application, ApplicationStatus status, LocalDate received, String source) {
        ApplicationStatus from = application.getStatus();
        application.setStatus(status);
        application.setLastContactDate(received);
        jobApplicationRepository.save(application);
        notify(userId, application, application.getCompanyName() + " moved to " + label(status),
                application.getJobTitle() + ": " + label(from) + " → " + label(status) + ", based on " + source + ".");
        return true;
    }

    private void notify(UUID userId, JobApplication application, String title, String message) {
        // Not linked to the application: notifications.job_application_id has no ON DELETE rule, so a
        // linked notification would block the user from ever deleting that application.
        notificationService.create(userId, new NotificationCreateRequest(NotificationType.STATUS_CHANGE, title, message, null));
    }

    private static String label(ApplicationStatus status) {
        String s = status.name().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
