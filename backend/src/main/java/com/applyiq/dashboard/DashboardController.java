package com.applyiq.dashboard;

import com.applyiq.auth.UserPrincipal;
import com.applyiq.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ApiResponse<DashboardResponse> getSummary(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(dashboardService.getSummary(principal.getUser().getId()));
    }
}
