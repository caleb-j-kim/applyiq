package com.applyiq.followups;

import com.applyiq.auth.UserPrincipal;
import com.applyiq.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/follow-ups")
@RequiredArgsConstructor
public class FollowUpController {

    private final FollowUpService followUpService;

    @GetMapping
    public ApiResponse<List<FollowUpRecommendationResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(followUpService.list(principal.getUser().getId()));
    }

    @PostMapping
    public ApiResponse<FollowUpRecommendationResponse> add(@AuthenticationPrincipal UserPrincipal principal,
                                                           @Valid @RequestBody FollowUpRequests.ManualRequest request) {
        return ApiResponse.success(followUpService.addManual(principal.getUser().getId(), request));
    }

    @PostMapping("/{id}/done")
    public ApiResponse<Void> done(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        followUpService.markDone(principal.getUser().getId(), id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/action")
    public ApiResponse<Void> action(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                    @Valid @RequestBody FollowUpRequests.ActionRequest request) {
        followUpService.applyAction(principal.getUser().getId(), id, request.action());
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/send")
    public ApiResponse<Void> send(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id,
                                  @Valid @RequestBody FollowUpRequests.SendRequest request) {
        followUpService.send(principal.getUser().getId(), id, request);
        return ApiResponse.success(null);
    }

    @GetMapping("/drafts")
    public ApiResponse<List<FollowUpRequests.DraftResponse>> drafts(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(followUpService.listDrafts(principal.getUser().getId()));
    }

    @PostMapping("/drafts")
    public ApiResponse<FollowUpRequests.DraftResponse> createDraft(@AuthenticationPrincipal UserPrincipal principal,
                                                                    @Valid @RequestBody FollowUpRequests.DraftRequest request) {
        return ApiResponse.success(followUpService.createDraft(principal.getUser().getId(), request));
    }

    @PutMapping("/drafts/{draftId}")
    public ApiResponse<FollowUpRequests.DraftResponse> updateDraft(@AuthenticationPrincipal UserPrincipal principal,
                                                                    @PathVariable UUID draftId,
                                                                    @Valid @RequestBody FollowUpRequests.DraftRequest request) {
        return ApiResponse.success(followUpService.updateDraft(principal.getUser().getId(), draftId, request));
    }

    @DeleteMapping("/drafts/{draftId}")
    public ApiResponse<Void> deleteDraft(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID draftId) {
        followUpService.deleteDraft(principal.getUser().getId(), draftId);
        return ApiResponse.success(null);
    }
}
