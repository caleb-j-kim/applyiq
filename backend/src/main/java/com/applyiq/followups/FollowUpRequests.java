package com.applyiq.followups;

import com.applyiq.applications.ApplicationStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

// Request/response bodies for FollowUpController.
final class FollowUpRequests {

    private FollowUpRequests() {
    }

    record DraftRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 255) String subtitle,
            @NotBlank @Size(max = 20000) String description) {
    }

    record DraftResponse(UUID id, String title, String subtitle, String description) {
        static DraftResponse from(FollowUpDraft d) {
            return new DraftResponse(d.getId(), d.getTitle(), d.getSubtitle(), d.getDescription());
        }
    }

    record ManualRequest(
            @NotBlank @Size(max = 255) String companyName,
            @NotBlank @Size(max = 255) String jobTitle,
            @NotNull ApplicationStatus status,
            LocalDate dateApplied,
            @NotBlank String recommendedAction,
            @Size(max = 5000) String note) {
    }

    /** The action the user clicked; must be the one currently shown for that follow-up. */
    record ActionRequest(@NotBlank String action) {
    }

    /**
     * Records a follow-up as sent. With sendEmail it's also emailed from the user's connected inbox
     * to {@code recipientEmail}; without, the user sent it themselves (copied the draft) and this only logs it.
     * (Named recipientEmail, not "to", so validation errors read "Please enter a valid recipient email.")
     */
    record SendRequest(
            boolean sendEmail,
            // Plain @Email accepts "name@host" with no domain suffix; require one.
            @Email(regexp = "[^@\\s]+@[^@\\s]+\\.[^@\\s]+") @Size(max = 320) String recipientEmail,
            @Size(max = 500) String subject,
            @Size(max = 20000) String body) {
    }
}
