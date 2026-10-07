package com.applyiq.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MatchScorePreviewRequest(
        @NotBlank String jobDescription,
        @NotNull UUID resumeId,
        boolean includeBulletSuggestions
) {
}
