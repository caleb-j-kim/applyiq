package com.applyiq.applications;

import jakarta.validation.constraints.NotNull;

public record JobApplicationStatusUpdateRequest(@NotNull ApplicationStatus status) {
}
