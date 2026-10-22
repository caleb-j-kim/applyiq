package com.applyiq.auth;

import com.applyiq.common.ApiResponse;
import com.applyiq.users.UserResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    public record TwoFactorLoginRequest(@NotBlank String challengeToken, @NotBlank String code) {
    }

    @PostMapping("/login/2fa")
    public ApiResponse<AuthResponse> loginTwoFactor(@Valid @RequestBody TwoFactorLoginRequest request) {
        return ApiResponse.success(authService.completeTwoFactorLogin(request.challengeToken(), request.code()));
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(UserResponse.from(principal.getUser()));
    }
}
