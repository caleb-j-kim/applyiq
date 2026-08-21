package com.applyiq.notifications;

import com.applyiq.auth.UserPrincipal;
import com.applyiq.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ApiResponse<NotificationResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                       @Valid @RequestBody NotificationCreateRequest request) {
        Notification notification = notificationService.create(principal.getUser().getId(), request);
        return ApiResponse.success(NotificationResponse.from(notification));
    }

    @GetMapping
    public ApiResponse<List<NotificationResponse>> list(@AuthenticationPrincipal UserPrincipal principal,
                                                           @RequestParam(defaultValue = "false") boolean unreadOnly) {
        List<NotificationResponse> notifications = notificationService
                .list(principal.getUser().getId(), unreadOnly)
                .stream()
                .map(NotificationResponse::from)
                .toList();
        return ApiResponse.success(notifications);
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(Map.of("unreadCount", notificationService.unreadCount(principal.getUser().getId())));
    }

    @GetMapping("/{id}")
    public ApiResponse<NotificationResponse> getOne(@AuthenticationPrincipal UserPrincipal principal,
                                                       @PathVariable UUID id) {
        Notification notification = notificationService.getOwned(principal.getUser().getId(), id);
        return ApiResponse.success(NotificationResponse.from(notification));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@AuthenticationPrincipal UserPrincipal principal,
                                                         @PathVariable UUID id) {
        Notification notification = notificationService.markRead(principal.getUser().getId(), id);
        return ApiResponse.success(NotificationResponse.from(notification));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getUser().getId());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        notificationService.delete(principal.getUser().getId(), id);
        return ApiResponse.success(null);
    }
}
