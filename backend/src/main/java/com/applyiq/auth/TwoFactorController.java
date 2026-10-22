package com.applyiq.auth;

import com.applyiq.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final TwoFactorService twoFactorService;

    public record PasswordRequest(@NotBlank String password) {
    }

    public record CodeRequest(@NotBlank String code) {
    }

    public record DisableRequest(@NotBlank String password, @NotBlank String code) {
    }

    @GetMapping
    public ApiResponse<TwoFactorService.Status> status(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(twoFactorService.status(principal.getUser().getId()));
    }

    @PostMapping("/setup")
    public ApiResponse<TwoFactorService.Setup> setup(@AuthenticationPrincipal UserPrincipal principal,
                                                      @Valid @RequestBody PasswordRequest request) {
        return ApiResponse.success(twoFactorService.startSetup(principal.getUser().getId(), request.password()));
    }

    @PostMapping("/enable")
    public ApiResponse<Map<String, List<String>>> enable(@AuthenticationPrincipal UserPrincipal principal,
                                                         @Valid @RequestBody CodeRequest request) {
        return ApiResponse.success(Map.of("recoveryCodes", twoFactorService.enable(principal.getUser().getId(), request.code())));
    }

    @PostMapping("/disable")
    public ApiResponse<Void> disable(@AuthenticationPrincipal UserPrincipal principal,
                                     @Valid @RequestBody DisableRequest request) {
        twoFactorService.disable(principal.getUser().getId(), request.password(), request.code());
        return ApiResponse.success(null);
    }
}
