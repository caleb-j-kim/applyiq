package com.applyiq.applications;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record JobApplicationCreateRequest(
        @NotBlank String companyName,
        @NotBlank String jobTitle,
        String location,
        String jobUrl,
        @NotNull ApplicationStatus status,
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
