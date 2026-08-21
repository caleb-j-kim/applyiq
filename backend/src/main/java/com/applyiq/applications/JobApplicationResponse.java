package com.applyiq.applications;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record JobApplicationResponse(
        UUID id,
        String companyName,
        String jobTitle,
        String location,
        String jobUrl,
        ApplicationStatus status,
        String source,
        LocalDate dateApplied,
        LocalDate lastContactDate,
        boolean hasReferral,
        String referralName,
        String referralRelationship,
        String referralContactInfo,
        LocalDate referralDate,
        String referralNotes,
        String recruiterName,
        String recruiterEmail,
        PriorityLevel priorityLevel,
        String jobDescription,
        String notes,
        int followUpCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static JobApplicationResponse from(JobApplication a) {
        return new JobApplicationResponse(
                a.getId(),
                a.getCompanyName(),
                a.getJobTitle(),
                a.getLocation(),
                a.getJobUrl(),
                a.getStatus(),
                a.getSource(),
                a.getDateApplied(),
                a.getLastContactDate(),
                a.isHasReferral(),
                a.getReferralName(),
                a.getReferralRelationship(),
                a.getReferralContactInfo(),
                a.getReferralDate(),
                a.getReferralNotes(),
                a.getRecruiterName(),
                a.getRecruiterEmail(),
                a.getPriorityLevel(),
                a.getJobDescription(),
                a.getNotes(),
                a.getFollowUpCount(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
