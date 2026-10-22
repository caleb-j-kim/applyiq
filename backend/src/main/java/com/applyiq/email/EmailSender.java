package com.applyiq.email;

import com.applyiq.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/** Sends mail from the user's connected Gmail — the email module's entry point for other modules. */
@Service
@RequiredArgsConstructor
public class EmailSender {

    private final EmailConnectionRepository connectionRepository;
    private final EmailOAuthService oauthService;
    private final InboxClient inboxClient;

    /** Returns the address it was sent from. */
    public String send(UUID userId, String to, String subject, String body) {
        EmailConnection connection = connectionRepository.findAllByUser_Id(userId).stream().findFirst()
                .orElseThrow(() -> new BadRequestException("Connect Gmail in Settings to send follow-ups from ApplyIQ."));
        // Also covers inboxes connected before 2FA was required: they keep syncing, but can't send.
        if (!connection.getUser().isTotpEnabled()) {
            throw new BadRequestException("Turn on two-factor authentication in Settings to send email from ApplyIQ.");
        }
        inboxClient.send(oauthService.accessToken(connection), to, subject, body);
        return connection.getEmailAddress();
    }
}
