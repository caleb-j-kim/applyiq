package com.applyiq.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * One interview prep (InterviewPrepResponseDto in frontend/src/lib/mappers.ts). Also the body
 * of POST /ai/interview-preps: the frontend saves exactly what it was shown. {@code id} and
 * {@code createdAt} are null until saved.
 */
public record InterviewPrepResponse(
        UUID id,
        UUID jobApplicationId,
        @NotBlank String companyName,
        @NotBlank String jobTitle,
        String resumeName,
        @NotNull PrepEffort effort,
        @NotEmpty List<@Valid Section> sections,
        Instant createdAt
) {

    public record Section(@NotBlank String title, @NotNull List<String> bullets) {
    }

    public static InterviewPrepResponse from(InterviewPrep prep) {
        return new InterviewPrepResponse(
                prep.getId(),
                prep.getJobApplication() == null ? null : prep.getJobApplication().getId(),
                prep.getCompanyName(),
                prep.getJobTitle(),
                prep.getResumeName(),
                prep.getEffort(),
                prep.getSections(),
                prep.getCreatedAt()
        );
    }
}
