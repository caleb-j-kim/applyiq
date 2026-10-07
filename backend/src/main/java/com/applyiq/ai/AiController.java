package com.applyiq.ai;

import com.applyiq.auth.UserPrincipal;
import com.applyiq.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final ResumeMatchService resumeMatchService;

    /** Analyze a tracked application's job description against a resume; persists the result. */
    @PostMapping("/applications/{id}/match-score")
    public ApiResponse<MatchAnalysisResponse> matchScore(@AuthenticationPrincipal UserPrincipal principal,
                                                           @PathVariable UUID id,
                                                           @Valid @RequestBody MatchScoreRequest request) {
        MatchAnalysisResponse response = resumeMatchService.analyzeForApplication(principal.getUser().getId(), id, request);
        return ApiResponse.success(response);
    }

    /** The most recent persisted analysis for this application, without recomputing (and re-billing) it. */
    @GetMapping("/applications/{id}/match-score")
    public ApiResponse<MatchAnalysisResponse> latestMatchScore(@AuthenticationPrincipal UserPrincipal principal,
                                                                 @PathVariable UUID id) {
        MatchAnalysisResponse response = resumeMatchService.getLatestForApplication(principal.getUser().getId(), id);
        return ApiResponse.success(response);
    }

    /** Analyze a pasted job description that isn't (yet, or ever) a tracked application. Still persisted for history. */
    @PostMapping("/match-score/preview")
    public ApiResponse<MatchAnalysisResponse> previewMatchScore(@AuthenticationPrincipal UserPrincipal principal,
                                                                  @Valid @RequestBody MatchScorePreviewRequest request) {
        MatchAnalysisResponse response = resumeMatchService.preview(principal.getUser().getId(), request);
        return ApiResponse.success(response);
    }
}
