package com.applyiq.followups;

import com.applyiq.applications.ApplicationStatus;

import java.util.List;
import java.util.UUID;

/**
 * One follow-up card. {@code id} is what the done/action/send endpoints take: the application's id
 * for model recommendations, the manual follow-up's id for ones the user added ({@code applicationId} null).
 */
public record FollowUpRecommendationResponse(
        UUID id,
        UUID applicationId,
        String companyName,
        String jobTitle,
        ApplicationStatus status,
        long daysSinceApplied,
        String recommendedAction,
        String reason,
        List<String> decisionFactors,
        double ghostingRiskScore,
        double confidence,
        String recruiterName,
        String recruiterEmail,
        boolean addedByUser
) {
}
