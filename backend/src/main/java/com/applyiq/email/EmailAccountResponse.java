package com.applyiq.email;

import java.time.Instant;

/** One row per supported provider; the connection fields are null until the user links that inbox. */
public record EmailAccountResponse(
        EmailProvider provider,
        boolean configured,
        boolean connected,
        String emailAddress,
        Instant lastSyncedAt,
        boolean autoUpdateStatus,
        boolean autoAddApplications
) {
    static EmailAccountResponse of(EmailProvider provider, boolean configured, EmailConnection c) {
        return c == null
                ? new EmailAccountResponse(provider, configured, false, null, null, false, false)
                : new EmailAccountResponse(provider, configured, true, c.getEmailAddress(), c.getLastSyncedAt(),
                        c.isAutoUpdateStatus(), c.isAutoAddApplications());
    }
}
