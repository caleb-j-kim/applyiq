package com.applyiq.dashboard;

import com.applyiq.applications.ApplicationStatus;
import com.applyiq.applications.JobApplicationResponse;

import java.time.LocalDate;
import java.util.List;

public record DashboardResponse(
        long total,
        long active,
        long withReferral,
        long withoutReferral,
        int referralResponseRate,
        int interviewRateWithReferral,
        int interviewRateWithoutReferral,
        long interviews,
        long offers,
        long rejected,
        long ghosted,
        long followUpsNeeded,
        List<StatusCount> statusBreakdown,
        List<WeeklyActivity> weeklyActivity,
        List<JobApplicationResponse> recentApplications
) {
    public record StatusCount(ApplicationStatus status, long count) {
    }

    public record WeeklyActivity(LocalDate weekStart, long applications) {
    }
}
