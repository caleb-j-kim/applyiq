package com.applyiq.ai;

import com.applyiq.applications.ApplicationStatus;

import java.util.List;
import java.util.UUID;

/**
 * Aggregates over a user's persisted match analyses for the Analytics page:
 * a score histogram in 10-point buckets, the skills most often missing
 * from their resume, and their best-matching tracked applications (Dashboard).
 */
public record MatchAnalyticsResponse(
        int analysesCounted,
        List<ScoreBucket> scoreDistribution,
        List<SkillCount> topMissingSkills,
        List<TopMatch> topMatches
) {
    public record ScoreBucket(String range, int count) {
    }

    public record SkillCount(String skill, long count) {
    }

    public record TopMatch(UUID applicationId, String companyName, String jobTitle,
                           ApplicationStatus status, int matchScore) {
    }
}
