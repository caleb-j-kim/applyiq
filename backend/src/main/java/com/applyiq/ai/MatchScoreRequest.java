package com.applyiq.ai;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MatchScoreRequest(
        @NotNull UUID resumeId,
        boolean includeBulletSuggestions
) {
}
