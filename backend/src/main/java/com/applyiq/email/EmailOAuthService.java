package com.applyiq.email;

import com.applyiq.auth.TwoFactorService;
import com.applyiq.common.TokenCipher;
import com.applyiq.common.exception.BadRequestException;
import com.applyiq.users.User;
import com.applyiq.users.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Authorization-code OAuth for Gmail, done with plain RestClient calls (no Google SDK). The browser opens the provider's consent page in a popup; the provider
 * redirects to /api/email/oauth/callback, which lands in {@link #completeAuthorization}.
 */
@Service
@RequiredArgsConstructor
public class EmailOAuthService {

    private static final Duration STATE_TTL = Duration.ofMinutes(10);
    // How far back the first sync looks, so recent confirmations/rejections are picked up on connect.
    private static final Duration INITIAL_LOOKBACK = Duration.ofDays(14);

    private record PendingAuth(UUID userId, EmailProvider provider, Instant expiresAt) {
    }

    // ponytail: in-memory OAuth state, so a login started on one backend instance must finish on
    // the same one; move to a signed state token or the DB if the backend is ever scaled out.
    private final Map<String, PendingAuth> pending = new ConcurrentHashMap<>();

    private final EmailConnectionRepository connectionRepository;
    private final UserService userService;
    private final TwoFactorService twoFactorService;
    private final TokenCipher cipher;
    private final InboxClient inboxClient;
    private final RestClient http = RestClient.create();
    private final ObjectMapper json = new ObjectMapper();

    @Value("${app.email.redirect-uri}")
    private String redirectUri;
    @Value("${app.email.google.client-id:}")
    private String googleClientId;
    @Value("${app.email.google.client-secret:}")
    private String googleClientSecret;
    @Value("${app.preview.email:}")
    private String previewEmail;

    public boolean isConfigured(EmailProvider provider) {
        return !clientId(provider).isBlank() && !clientSecret(provider).isBlank();
    }

    /**
     * Starts Google sign-in. Requires 2FA to be on and the account password re-entered: a stolen
     * session token alone (no password) can't link an inbox, and neither can a stolen password
     * alone (no second factor), since a linked inbox can send mail as the user.
     */
    public String authorizationUrl(UUID userId, EmailProvider provider, String password) {
        if (!isConfigured(provider)) {
            throw new BadRequestException(provider + " sign-in isn't configured on this server yet.");
        }
        User user = userService.getById(userId);
        // The preview account's password is published on the marketing site, so anyone could log in and
        // see (or send from) a linked inbox. The local-only DEMO_EMAIL account is allowed, for testing.
        if (user.getEmail().equalsIgnoreCase(previewEmail)) {
            throw new BadRequestException("Email connections are disabled on the shared preview account. Sign up for your own account to connect Gmail.");
        }
        if (!user.isTotpEnabled()) {
            throw new BadRequestException("Turn on two-factor authentication in Settings before connecting Gmail.");
        }
        twoFactorService.confirmPassword(user, password);

        Instant now = Instant.now();
        pending.values().removeIf(p -> p.expiresAt().isBefore(now));
        String state = UUID.randomUUID().toString();
        pending.put(state, new PendingAuth(userId, provider, now.plus(STATE_TTL)));

        UriComponentsBuilder url = UriComponentsBuilder.fromUriString(provider.authUrl)
                .queryParam("client_id", clientId(provider))
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", provider.scope)
                .queryParam("state", state);
        // Google only issues a refresh token with offline access + an explicit consent prompt.
        url.queryParam("access_type", "offline").queryParam("prompt", "consent");
        return url.encode().build().toUriString();
    }

    public EmailConnection completeAuthorization(String code, String state) {
        PendingAuth auth = state == null ? null : pending.remove(state);
        if (auth == null || auth.expiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("This sign-in link expired. Start the connection again from Settings.");
        }

        MultiValueMap<String, String> form = baseForm(auth.provider());
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", redirectUri);
        JsonNode token = postToken(auth.provider(), form);
        if (!token.hasNonNull("refresh_token")) {
            throw new BadRequestException("The provider didn't grant offline access. Remove ApplyIQ from your account's connected apps and try again.");
        }

        User user = userService.getById(auth.userId());
        EmailConnection connection = connectionRepository.findByUser_IdAndProvider(user.getId(), auth.provider())
                .orElseGet(() -> EmailConnection.builder()
                        .user(user)
                        .provider(auth.provider())
                        .lastSyncedAt(Instant.now().minus(INITIAL_LOOKBACK))
                        .autoUpdateStatus(true)
                        .autoAddApplications(true)
                        .build());
        connection.setRefreshTokenEnc(cipher.encrypt(token.get("refresh_token").asText()));
        storeAccessToken(connection, token);
        connection.setEmailAddress(inboxClient.emailAddress(token.get("access_token").asText()));
        return connectionRepository.save(connection);
    }

    /** A valid access token for this connection, refreshing (and persisting the new one) when close to expiry. */
    public String accessToken(EmailConnection connection) {
        Instant expiresAt = connection.getAccessTokenExpiresAt();
        if (connection.getAccessTokenEnc() != null && expiresAt != null && expiresAt.isAfter(Instant.now().plusSeconds(60))) {
            return cipher.decrypt(connection.getAccessTokenEnc());
        }
        MultiValueMap<String, String> form = baseForm(connection.getProvider());
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", cipher.decrypt(connection.getRefreshTokenEnc()));
        JsonNode token = postToken(connection.getProvider(), form);
        if (token.hasNonNull("refresh_token")) { // Google may rotate the refresh token
            connection.setRefreshTokenEnc(cipher.encrypt(token.get("refresh_token").asText()));
        }
        storeAccessToken(connection, token);
        connectionRepository.save(connection);
        return token.get("access_token").asText();
    }

    /** Best-effort token revocation on disconnect. */
    public void revoke(EmailConnection connection) {
        try {
            http.post().uri("https://oauth2.googleapis.com/revoke?token={t}", cipher.decrypt(connection.getRefreshTokenEnc()))
                    .retrieve().toBodilessEntity();
        } catch (Exception ignored) {
            // Already revoked or expired — deleting our copy is what matters.
        }
    }

    private void storeAccessToken(EmailConnection connection, JsonNode token) {
        connection.setAccessTokenEnc(cipher.encrypt(token.get("access_token").asText()));
        connection.setAccessTokenExpiresAt(Instant.now().plusSeconds(token.path("expires_in").asLong(3600)));
    }

    private JsonNode postToken(EmailProvider provider, MultiValueMap<String, String> form) {
        try {
            String body = http.post().uri(provider.tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(String.class);
            return json.readTree(body);
        } catch (Exception e) {
            throw new BadRequestException("Couldn't get access from " + provider + ": " + e.getMessage());
        }
    }

    private MultiValueMap<String, String> baseForm(EmailProvider provider) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId(provider));
        form.add("client_secret", clientSecret(provider));
        return form;
    }

    private String clientId(EmailProvider provider) {
        return googleClientId;
    }

    private String clientSecret(EmailProvider provider) {
        return googleClientSecret;
    }
}
