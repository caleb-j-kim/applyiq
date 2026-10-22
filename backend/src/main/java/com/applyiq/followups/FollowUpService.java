package com.applyiq.followups;

import com.applyiq.applications.ApplicationStatus;
import com.applyiq.applications.JobApplication;
import com.applyiq.applications.JobApplicationRepository;
import com.applyiq.applications.JobApplicationService;
import com.applyiq.applications.PriorityLevel;
import com.applyiq.common.RateLimiter;
import com.applyiq.common.exception.BadRequestException;
import com.applyiq.common.exception.ResourceNotFoundException;
import com.applyiq.common.exception.TooManyRequestsException;
import com.applyiq.email.EmailSender;
import com.applyiq.notifications.NotificationCreateRequest;
import com.applyiq.notifications.NotificationService;
import com.applyiq.notifications.NotificationType;
import com.applyiq.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class FollowUpService {

    // Saved hasn't been sent anywhere yet and Offer needs a decision, not a follow-up.
    private static final Set<ApplicationStatus> SKIPPED = EnumSet.of(ApplicationStatus.SAVED, ApplicationStatus.OFFER);
    private static final String WAIT = "Wait longer";
    private static final String ARCHIVE = "Archive application";

    private static final Map<String, String> REASONS = Map.of(
            "Send first follow-up", "It's been quiet long enough that a short check-in is worth sending.",
            "Send final follow-up", "One follow-up went unanswered — one last, brief note is reasonable before moving on.",
            WAIT, "Too soon to follow up — give the company more time.",
            "Mark as likely ghosted", "Multiple follow-ups have gone unanswered for weeks; this one has likely gone cold.",
            "Move to rejected", "No response in over two months — treat this as a silent rejection.",
            ARCHIVE, "This application is closed — safe to archive and remove from active tracking.");

    // The status each action moves the application to; the rest only clear the recommendation.
    private static final Map<String, ApplicationStatus> STATUS_FOR_ACTION = Map.of(
            "Mark as likely ghosted", ApplicationStatus.GHOSTED,
            "Move to rejected", ApplicationStatus.REJECTED);

    private static final int MAX_EMAILS_PER_HOUR = 20;
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt");

    private final FollowUpModel model;
    private final JobApplicationService jobApplicationService;
    private final JobApplicationRepository jobApplicationRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final EmailSender emailSender;
    private final RateLimiter rateLimiter;
    private final FollowUpDraftRepository draftRepository;
    private final ManualFollowUpRepository manualRepository;
    private final FollowUpDismissalRepository dismissalRepository;

    // ---- recommendations ----------------------------------------------------------------

    /** The user's own follow-ups first, then every model recommendation that needs action now, riskiest first. */
    public List<FollowUpRecommendationResponse> list(UUID userId) {
        LocalDate today = LocalDate.now();
        Set<String> dismissed = dismissalRepository.findAllByUserId(userId).stream()
                .map(d -> d.getJobApplicationId() + "|" + d.getRecommendedAction())
                .collect(Collectors.toSet());
        Stream<FollowUpRecommendationResponse> manual = manualRepository.findAllByUser_Id(userId, NEWEST_FIRST).stream()
                .map(m -> fromManual(m, today));
        Stream<FollowUpRecommendationResponse> recommended = jobApplicationService.list(userId, null, null).stream()
                .map(a -> recommend(a, today))
                .flatMap(Optional::stream)
                .filter(r -> !r.recommendedAction().equals(WAIT))
                .filter(r -> !dismissed.contains(r.applicationId() + "|" + r.recommendedAction()))
                .sorted(Comparator.comparingDouble(FollowUpRecommendationResponse::ghostingRiskScore).reversed());
        return Stream.concat(manual, recommended).toList();
    }

    public FollowUpRecommendationResponse addManual(UUID userId, FollowUpRequests.ManualRequest request) {
        requireKnownAction(request.recommendedAction());
        ManualFollowUp saved = manualRepository.save(ManualFollowUp.builder()
                .user(userService.getById(userId))
                .companyName(request.companyName().trim())
                .jobTitle(request.jobTitle().trim())
                .status(request.status())
                .dateApplied(request.dateApplied())
                .recommendedAction(request.recommendedAction())
                .note(request.note())
                .build());
        return fromManual(saved, LocalDate.now());
    }

    /** "Mark as done": hides it without changing the application. */
    public void markDone(UUID userId, UUID id) {
        Optional<ManualFollowUp> manual = manualRepository.findByIdAndUser_Id(id, userId);
        if (manual.isPresent()) {
            manualRepository.delete(manual.get());
            return;
        }
        currentRecommendation(userId, id).ifPresent(r -> dismiss(userId, id, r.recommendedAction()));
    }

    /** The non-send action buttons (ghosted / rejected / archive / wait). Send actions go through {@link #send}. */
    public void applyAction(UUID userId, UUID id, String action) {
        requireKnownAction(action);
        Optional<ManualFollowUp> manual = manualRepository.findByIdAndUser_Id(id, userId);
        if (manual.isPresent()) {
            manualRepository.delete(manual.get());
            notify(userId, manual.get().getCompanyName() + ": " + action.toLowerCase(), manual.get().getJobTitle() + " — done.");
            return;
        }

        JobApplication application = jobApplicationService.getOwned(userId, id);
        ApplicationStatus status = STATUS_FOR_ACTION.get(action);
        if (status == null) {
            dismiss(userId, id, action);
        } else {
            ApplicationStatus from = application.getStatus();
            application = jobApplicationService.updateStatus(userId, id, status);
            // A rejected application's next recommendation is just "archive" — the user already acted on it.
            recommend(application, LocalDate.now())
                    .filter(r -> r.recommendedAction().equals(ARCHIVE))
                    .ifPresent(r -> dismiss(userId, id, ARCHIVE));
            notify(userId, application.getCompanyName() + " moved to " + label(status),
                    application.getJobTitle() + ": " + label(from) + " → " + label(status) + " from Follow-Ups.");
            return;
        }
        notify(userId, application.getCompanyName() + ": " + action.toLowerCase(), application.getJobTitle() + " — done.");
    }

    /** Logs a follow-up as sent (and emails it when asked), then raises a notification for the bell. */
    public void send(UUID userId, UUID id, FollowUpRequests.SendRequest request) {
        Optional<ManualFollowUp> manual = manualRepository.findByIdAndUser_Id(id, userId);
        JobApplication application = manual.isPresent() ? null : jobApplicationService.getOwned(userId, id);
        String company = application != null ? application.getCompanyName() : manual.get().getCompanyName();
        String jobTitle = application != null ? application.getJobTitle() : manual.get().getJobTitle();

        String title;
        String detail;
        if (request.sendEmail()) {
            String to = request.recipientEmail() == null ? "" : request.recipientEmail().trim();
            if (to.isEmpty()) throw new BadRequestException("Please enter the recipient's email address.");
            if (request.subject() == null || request.subject().isBlank() || request.body() == null || request.body().isBlank()) {
                throw new BadRequestException("Please fill in the subject and message.");
            }
            // Caps the damage if a session is ever stolen: a linked Gmail can't be turned into a spam cannon.
            if (!rateLimiter.tryAcquire("email-send:" + userId, MAX_EMAILS_PER_HOUR, Duration.ofHours(1))) {
                throw new TooManyRequestsException("You've sent " + MAX_EMAILS_PER_HOUR
                        + " follow-up emails in the last hour. Please wait before sending more.");
            }
            String from = emailSender.send(userId, to, request.subject(), request.body());
            title = "Follow-up emailed to " + company;
            detail = jobTitle + " — sent to " + to + " from " + from + ".";
        } else {
            title = "Follow-up marked as sent: " + company;
            detail = jobTitle + " — you sent it yourself.";
        }

        if (application != null) {
            // Sending resets the quiet-days clock and bumps the count — the two inputs the model uses next.
            application.setFollowUpCount(application.getFollowUpCount() + 1);
            application.setLastContactDate(LocalDate.now());
            jobApplicationRepository.save(application);
        } else {
            manualRepository.delete(manual.get());
        }
        notify(userId, title, detail);
    }

    // ---- drafts -------------------------------------------------------------------------

    public List<FollowUpRequests.DraftResponse> listDrafts(UUID userId) {
        return draftRepository.findAllByUser_Id(userId, Sort.by("createdAt")).stream()
                .map(FollowUpRequests.DraftResponse::from).toList();
    }

    public FollowUpRequests.DraftResponse createDraft(UUID userId, FollowUpRequests.DraftRequest request) {
        FollowUpDraft draft = FollowUpDraft.builder().user(userService.getById(userId)).build();
        return saveDraft(draft, request);
    }

    public FollowUpRequests.DraftResponse updateDraft(UUID userId, UUID draftId, FollowUpRequests.DraftRequest request) {
        return saveDraft(ownedDraft(userId, draftId), request);
    }

    public void deleteDraft(UUID userId, UUID draftId) {
        draftRepository.delete(ownedDraft(userId, draftId));
    }

    private FollowUpRequests.DraftResponse saveDraft(FollowUpDraft draft, FollowUpRequests.DraftRequest request) {
        draft.setTitle(request.title().trim());
        draft.setSubtitle(request.subtitle() == null ? null : request.subtitle().trim());
        draft.setDescription(request.description());
        return FollowUpRequests.DraftResponse.from(draftRepository.save(draft));
    }

    private FollowUpDraft ownedDraft(UUID userId, UUID draftId) {
        return draftRepository.findByIdAndUser_Id(draftId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("No draft found with id " + draftId));
    }

    // ---- model --------------------------------------------------------------------------

    Optional<FollowUpRecommendationResponse> recommend(JobApplication a, LocalDate today) {
        if (SKIPPED.contains(a.getStatus()) || a.getDateApplied() == null) return Optional.empty();

        long sinceApplied = Math.max(0, ChronoUnit.DAYS.between(a.getDateApplied(), today));
        LocalDate lastContact = a.getLastContactDate() != null ? a.getLastContactDate() : a.getDateApplied();
        long sinceContact = Math.max(0, ChronoUnit.DAYS.between(lastContact, today));
        int rounds = a.getInterviewRoundsCompleted() != null ? a.getInterviewRoundsCompleted() : 0;

        // Same order as FEATURES in ml/follow_up_model/train.py.
        ApplicationStatus s = a.getStatus();
        double[] x = {
                bit(s == ApplicationStatus.APPLIED),
                bit(s == ApplicationStatus.ONLINE_ASSESSMENT),
                bit(s == ApplicationStatus.INTERVIEWING),
                bit(s == ApplicationStatus.FINAL_ROUND),
                bit(s == ApplicationStatus.GHOSTED),
                bit(s == ApplicationStatus.REJECTED),
                bit(s == ApplicationStatus.WITHDRAWN),
                sinceApplied,
                sinceContact,
                a.getFollowUpCount(),
                bit(a.isHasReferral()),
                priority(a.getPriorityLevel()),
                rounds,
        };
        FollowUpModel.Prediction p = model.predict(x);
        return Optional.of(new FollowUpRecommendationResponse(
                a.getId(), a.getId(), a.getCompanyName(), a.getJobTitle(), s, sinceApplied,
                p.action(), REASONS.get(p.action()), explain(p, x),
                round2(p.ghostingRisk()), round2(p.confidence()),
                a.getRecruiterName(), a.getRecruiterEmail(), false));
    }

    /** Turns the splits the tree took into plain-English factors, one per feature, with the cutoff it used. */
    List<String> explain(FollowUpModel.Prediction p, double[] x) {
        Map<Integer, double[]> bounds = new LinkedHashMap<>(); // feature -> {lower (exclusive), upper (inclusive)}
        for (FollowUpModel.Split split : p.path()) {
            double[] b = bounds.computeIfAbsent(split.feature(), k -> new double[]{Double.NEGATIVE_INFINITY, Double.POSITIVE_INFINITY});
            if (split.atOrBelow()) b[1] = Math.min(b[1], split.threshold());
            else b[0] = Math.max(b[0], split.threshold());
        }
        List<String> factors = new ArrayList<>();
        bounds.forEach((feature, b) -> {
            String name = model.features().get(feature);
            if (name.startsWith("status_")) return; // the status badge already says this
            int v = (int) x[feature];
            factors.add(switch (name) {
                case "days_since_applied" -> plural(v, "day") + " since applying" + cutoff(b);
                case "days_since_contact" -> plural(v, "day") + " since last contact" + cutoff(b);
                case "follow_up_count" -> v == 0 ? "No follow-ups sent yet" : plural(v, "follow-up") + " sent";
                case "has_referral" -> v == 1 ? "Has a referral" : "No referral";
                case "priority" -> new String[]{"Low", "Medium", "High"}[v] + " priority";
                case "interview_rounds_completed" -> plural(v, "interview round") + " completed";
                default -> name + " = " + v;
            });
        });
        return factors;
    }

    private Optional<FollowUpRecommendationResponse> currentRecommendation(UUID userId, UUID applicationId) {
        return recommend(jobApplicationService.getOwned(userId, applicationId), LocalDate.now());
    }

    private void dismiss(UUID userId, UUID applicationId, String action) {
        if (!dismissalRepository.existsByUserIdAndJobApplicationIdAndRecommendedAction(userId, applicationId, action)) {
            dismissalRepository.save(FollowUpDismissal.builder()
                    .userId(userId).jobApplicationId(applicationId).recommendedAction(action).build());
        }
    }

    private FollowUpRecommendationResponse fromManual(ManualFollowUp m, LocalDate today) {
        long sinceApplied = m.getDateApplied() == null ? 0 : Math.max(0, ChronoUnit.DAYS.between(m.getDateApplied(), today));
        return new FollowUpRecommendationResponse(m.getId(), null, m.getCompanyName(), m.getJobTitle(), m.getStatus(),
                sinceApplied, m.getRecommendedAction(), m.getNote() == null ? "" : m.getNote(), List.of(), 0, 0,
                null, null, true);
    }

    private void notify(UUID userId, String title, String message) {
        notificationService.create(userId, new NotificationCreateRequest(NotificationType.FOLLOW_UP_REMINDER, title, message, null));
    }

    private void requireKnownAction(String action) {
        if (!REASONS.containsKey(action)) throw new BadRequestException("Unknown follow-up action: " + action);
    }

    private static String cutoff(double[] b) {
        boolean hasLower = b[0] != Double.NEGATIVE_INFINITY;
        boolean hasUpper = b[1] != Double.POSITIVE_INFINITY;
        if (hasLower && hasUpper) return " (model range: " + (int) Math.ceil(b[0]) + "–" + (int) Math.floor(b[1]) + ")";
        if (hasLower) return " (model cutoff: over " + (int) Math.floor(b[0]) + ")";
        if (hasUpper) return " (model cutoff: " + (int) Math.floor(b[1]) + " or fewer)";
        return "";
    }

    private static String label(ApplicationStatus status) {
        String s = status.name().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private static String plural(int n, String word) {
        return n + " " + word + (n == 1 ? "" : "s");
    }

    private static double bit(boolean b) {
        return b ? 1 : 0;
    }

    private static double priority(PriorityLevel level) {
        return level == null ? 1 : level.ordinal();
    }

    private static double round2(double v) {
        return Math.round(v * 100) / 100.0;
    }
}
