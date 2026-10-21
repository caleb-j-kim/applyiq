package com.applyiq.ai;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InterviewPrepRequest(
        @NotNull UUID resumeId,
        @NotNull PrepEffort effort
) {
}
