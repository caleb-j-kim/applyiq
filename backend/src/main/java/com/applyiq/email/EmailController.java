package com.applyiq.email;

import com.applyiq.auth.UserPrincipal;
import com.applyiq.common.ApiResponse;
import com.applyiq.common.exception.BadRequestException;
import com.applyiq.common.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailController {

    private static final Logger log = LoggerFactory.getLogger(EmailController.class);

    private final EmailConnectionRepository connectionRepository;
    private final EmailOAuthService oauthService;
    private final EmailSyncService syncService;

    @GetMapping
    public ApiResponse<List<EmailAccountResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        List<EmailConnection> connections = connectionRepository.findAllByUser_Id(principal.getUser().getId());
        return ApiResponse.success(Arrays.stream(EmailProvider.values())
                .map(p -> EmailAccountResponse.of(p, oauthService.isConfigured(p),
                        connections.stream().filter(c -> c.getProvider() == p).findFirst().orElse(null)))
                .toList());
    }

    public record AuthorizeRequest(@NotBlank String password) {
    }

    @PostMapping("/{provider}/authorize")
    public ApiResponse<Map<String, String>> authorize(@AuthenticationPrincipal UserPrincipal principal,
                                                       @PathVariable EmailProvider provider,
                                                       @Valid @RequestBody AuthorizeRequest request) {
        return ApiResponse.success(Map.of("url",
                oauthService.authorizationUrl(principal.getUser().getId(), provider, request.password())));
    }

    // Public (see SecurityConfig): the provider redirects the consent popup here with no bearer
    // token. The one-time state parameter is what ties it back to the user who started it.
    @GetMapping("/oauth/callback")
    public ResponseEntity<String> callback(@RequestParam(required = false) String code,
                                           @RequestParam(required = false) String state,
                                           @RequestParam(required = false) String error) {
        String message;
        boolean ok = false;
        try {
            if (error != null || code == null) throw new BadRequestException("Access wasn't granted (" + (error != null ? error : "no code") + ").");
            EmailConnection connection = oauthService.completeAuthorization(code, state);
            // In the background: the first sync reads 14 days of mail, which shouldn't hold the popup open.
            CompletableFuture.runAsync(() -> syncSafely(connection));
            message = "Connected. You can close this window.";
            ok = true;
        } catch (BadRequestException e) {
            log.warn("Email OAuth callback failed: {}", e.getMessage());
            message = "Couldn't connect: " + e.getMessage();
        }
        // Escaped text only. Auto-closes on success; on failure it stays open so the reason can be read.
        String html = "<!doctype html><meta charset=utf-8><title>ApplyIQ</title>"
                + "<body style=\"font-family:system-ui;padding:2rem\"><p>" + escape(message) + "</p>"
                + (ok ? "<script>setTimeout(()=>window.close(),1500)</script>" : "<p>Close this window and try again from Settings.</p>")
                + "</body>";
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }

    @PatchMapping("/{provider}")
    public ApiResponse<EmailAccountResponse> updateSettings(@AuthenticationPrincipal UserPrincipal principal,
                                                            @PathVariable EmailProvider provider,
                                                            @RequestBody EmailSettingsRequest request) {
        EmailConnection connection = owned(principal.getUser().getId(), provider);
        if (request.autoUpdateStatus() != null) connection.setAutoUpdateStatus(request.autoUpdateStatus());
        if (request.autoAddApplications() != null) connection.setAutoAddApplications(request.autoAddApplications());
        return ApiResponse.success(EmailAccountResponse.of(provider, oauthService.isConfigured(provider), connectionRepository.save(connection)));
    }

    @PostMapping("/{provider}/sync")
    public ApiResponse<Map<String, Integer>> syncNow(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable EmailProvider provider) {
        return ApiResponse.success(Map.of("changes", syncService.sync(owned(principal.getUser().getId(), provider))));
    }

    @DeleteMapping("/{provider}")
    public ApiResponse<Void> disconnect(@AuthenticationPrincipal UserPrincipal principal, @PathVariable EmailProvider provider) {
        EmailConnection connection = owned(principal.getUser().getId(), provider);
        oauthService.revoke(connection);
        connectionRepository.delete(connection);
        return ApiResponse.success(null);
    }

    private EmailConnection owned(UUID userId, EmailProvider provider) {
        return connectionRepository.findByUser_IdAndProvider(userId, provider)
                .orElseThrow(() -> new ResourceNotFoundException("No " + provider + " account connected"));
    }

    // The first sync is a bonus on connect; the scheduler retries it anyway.
    private void syncSafely(EmailConnection connection) {
        try {
            syncService.sync(connection);
        } catch (Exception e) {
            log.warn("First email sync after connecting failed: {}", e.getMessage());
        }
    }

    private static String escape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
