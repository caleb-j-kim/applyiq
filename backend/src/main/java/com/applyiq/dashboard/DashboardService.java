package com.applyiq.dashboard;

import com.applyiq.applications.ApplicationStatus;
import com.applyiq.applications.JobApplication;
import com.applyiq.applications.JobApplicationResponse;
import com.applyiq.applications.JobApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final Set<ApplicationStatus> ACTIVE_STATUSES = EnumSet.of(
            ApplicationStatus.SAVED, ApplicationStatus.APPLIED, ApplicationStatus.ONLINE_ASSESSMENT,
            ApplicationStatus.INTERVIEWING, ApplicationStatus.FINAL_ROUND);

    // Broader "got some response" set for referralResponseRate — current-status based, distinct
    // from the interview rate below (which is history-based on completed interview rounds).
    private static final Set<ApplicationStatus> INTERVIEWED_STATUSES = EnumSet.of(
            ApplicationStatus.INTERVIEWING, ApplicationStatus.FINAL_ROUND,
            ApplicationStatus.OFFER, ApplicationStatus.REJECTED);

    private static final int FOLLOW_UP_THRESHOLD_DAYS = 7;
    private static final int WEEKLY_ACTIVITY_WEEKS = 6;
    private static final int RECENT_APPLICATIONS_LIMIT = 5;

    private final JobApplicationService jobApplicationService;

    public DashboardResponse getSummary(UUID userId) {
        List<JobApplication> applications = jobApplicationService.list(userId, null, null);

        long total = applications.size();
        long withReferral = applications.stream().filter(JobApplication::isHasReferral).count();
        long withoutReferral = total - withReferral;

        long interviewedWithReferral = applications.stream()
                .filter(a -> a.isHasReferral() && INTERVIEWED_STATUSES.contains(a.getStatus()))
                .count();

        // History-based, not status-based: a completed interview round still counts toward the
        // rate even after the application moves on to Offer/Rejected/etc. It only stops counting
        // if the application is reset back to APPLIED, which clears these fields (see
        // JobApplicationService.discardInterviewProgressIfApplied) — so this naturally recomputes
        // correctly on every dashboard read after any status update.
        long completedInterviewWithReferral = applications.stream()
                .filter(a -> a.isHasReferral() && hasCompletedInterview(a))
                .count();
        long completedInterviewWithoutReferral = applications.stream()
                .filter(a -> !a.isHasReferral() && hasCompletedInterview(a))
                .count();

        long active = applications.stream().filter(a -> ACTIVE_STATUSES.contains(a.getStatus())).count();
        // Total interviews had, not a current-status snapshot: sums every completed round
        // across every application, so one application with 2 of 3 rounds done contributes 2,
        // not 1 — consistent with the interview rate now being history-based too.
        long interviews = applications.stream()
                .mapToLong(a -> a.getInterviewRoundsCompleted() != null ? a.getInterviewRoundsCompleted() : 0)
                .sum();
        long offers = countByStatus(applications, ApplicationStatus.OFFER);
        long rejected = countByStatus(applications, ApplicationStatus.REJECTED);
        long ghosted = countByStatus(applications, ApplicationStatus.GHOSTED);

        long followUpsNeeded = applications.stream()
                .filter(a -> ACTIVE_STATUSES.contains(a.getStatus()))
                .filter(this::needsFollowUp)
                .count();

        int referralResponseRate = ratePercent(interviewedWithReferral, withReferral);
        int interviewRateWithReferral = ratePercent(completedInterviewWithReferral, withReferral);
        int interviewRateWithoutReferral = ratePercent(completedInterviewWithoutReferral, withoutReferral);

        return new DashboardResponse(
                total,
                active,
                withReferral,
                withoutReferral,
                referralResponseRate,
                interviewRateWithReferral,
                interviewRateWithoutReferral,
                interviews,
                offers,
                rejected,
                ghosted,
                followUpsNeeded,
                statusBreakdown(applications),
                weeklyActivity(applications),
                recentApplications(applications)
        );
    }

    private boolean needsFollowUp(JobApplication application) {
        LocalDate lastActivity = application.getLastContactDate() != null
                ? application.getLastContactDate()
                : application.getDateApplied();
        if (lastActivity == null) {
            return false;
        }
        return lastActivity.isBefore(LocalDate.now().minusDays(FOLLOW_UP_THRESHOLD_DAYS));
    }

    private long countByStatus(List<JobApplication> applications, ApplicationStatus status) {
        return applications.stream().filter(a -> a.getStatus() == status).count();
    }

    private int ratePercent(long numerator, long denominator) {
        return denominator == 0 ? 0 : Math.round((numerator * 100f) / denominator);
    }

    private boolean hasCompletedInterview(JobApplication application) {
        Integer completed = application.getInterviewRoundsCompleted();
        return completed != null && completed > 0;
    }

    private List<DashboardResponse.StatusCount> statusBreakdown(List<JobApplication> applications) {
        Map<ApplicationStatus, Long> counts = applications.stream()
                .collect(Collectors.groupingBy(JobApplication::getStatus, Collectors.counting()));
        return java.util.Arrays.stream(ApplicationStatus.values())
                .map(status -> new DashboardResponse.StatusCount(status, counts.getOrDefault(status, 0L)))
                .toList();
    }

    private List<DashboardResponse.WeeklyActivity> weeklyActivity(List<JobApplication> applications) {
        LocalDate currentWeekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate earliestWeekStart = currentWeekStart.minusWeeks(WEEKLY_ACTIVITY_WEEKS - 1L);

        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (int i = 0; i < WEEKLY_ACTIVITY_WEEKS; i++) {
            counts.put(earliestWeekStart.plusWeeks(i), 0L);
        }

        for (JobApplication application : applications) {
            LocalDate dateApplied = application.getDateApplied();
            if (dateApplied == null || dateApplied.isBefore(earliestWeekStart)) {
                continue;
            }
            LocalDate weekStart = dateApplied.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            counts.merge(weekStart, 1L, Long::sum);
        }

        return counts.entrySet().stream()
                .map(e -> new DashboardResponse.WeeklyActivity(e.getKey(), e.getValue()))
                .toList();
    }

    private List<JobApplicationResponse> recentApplications(List<JobApplication> applications) {
        return applications.stream()
                .limit(RECENT_APPLICATIONS_LIMIT)
                .map(JobApplicationResponse::from)
                .toList();
    }
}
