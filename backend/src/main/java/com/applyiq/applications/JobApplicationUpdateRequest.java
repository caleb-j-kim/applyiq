package com.applyiq.applications;

import jakarta.validation.constraints.Email;

import java.time.LocalDate;

public record JobApplicationUpdateRequest(
        String companyName,
        String jobTitle,
        String location,
        String jobUrl,
        ApplicationStatus status,
        String source,
        LocalDate dateApplied,
        LocalDate lastContactDate,
        Boolean hasReferral,
        String referralName,
        String referralRelationship,
        String referralContactInfo,
        LocalDate referralDate,
        String referralNotes,
        String recruiterName,
        @Email String recruiterEmail,
        PriorityLevel priorityLevel,
        String jobDescription,
        String notes
) {
}
