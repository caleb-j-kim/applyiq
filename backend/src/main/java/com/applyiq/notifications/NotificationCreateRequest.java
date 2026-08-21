package com.applyiq.notifications;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record NotificationCreateRequest(
        @NotNull NotificationType type,
        @NotBlank String title,
        String message,
        UUID jobApplicationId
) {
}
