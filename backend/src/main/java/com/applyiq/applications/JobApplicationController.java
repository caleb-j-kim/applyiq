package com.applyiq.applications;

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
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;

    @PostMapping
    public ApiResponse<JobApplicationResponse> create(@AuthenticationPrincipal UserPrincipal principal,
                                                        @Valid @RequestBody JobApplicationCreateRequest request) {
        JobApplication application = jobApplicationService.create(principal.getUser().getId(), request);
        return ApiResponse.success(JobApplicationResponse.from(application));
    }

    @GetMapping
    public ApiResponse<List<JobApplicationResponse>> list(@AuthenticationPrincipal UserPrincipal principal,
                                                            @RequestParam(required = false) ApplicationStatus status,
                                                            @RequestParam(required = false) String search) {
        List<JobApplicationResponse> applications = jobApplicationService
                .list(principal.getUser().getId(), status, search)
                .stream()
                .map(JobApplicationResponse::from)
                .toList();
        return ApiResponse.success(applications);
    }

    @GetMapping("/{id}")
    public ApiResponse<JobApplicationResponse> getOne(@AuthenticationPrincipal UserPrincipal principal,
                                                        @PathVariable UUID id) {
        JobApplication application = jobApplicationService.getOwned(principal.getUser().getId(), id);
        return ApiResponse.success(JobApplicationResponse.from(application));
    }

    @PatchMapping("/{id}")
    public ApiResponse<JobApplicationResponse> update(@AuthenticationPrincipal UserPrincipal principal,
                                                        @PathVariable UUID id,
                                                        @Valid @RequestBody JobApplicationUpdateRequest request) {
        JobApplication application = jobApplicationService.update(principal.getUser().getId(), id, request);
        return ApiResponse.success(JobApplicationResponse.from(application));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<JobApplicationResponse> updateStatus(@AuthenticationPrincipal UserPrincipal principal,
                                                              @PathVariable UUID id,
                                                              @Valid @RequestBody JobApplicationStatusUpdateRequest request) {
        JobApplication application = jobApplicationService.updateStatus(principal.getUser().getId(), id, request.status());
        return ApiResponse.success(JobApplicationResponse.from(application));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        jobApplicationService.delete(principal.getUser().getId(), id);
        return ApiResponse.success(null);
    }
}
