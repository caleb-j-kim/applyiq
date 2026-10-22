package com.applyiq.auth;

import com.applyiq.users.UserResponse;

/**
 * Login/register result. With 2FA on, a correct password returns only {@code twoFactorRequired}
 * and a short-lived {@code challengeToken} (no session token or user); exchanging that plus a code
 * at POST /api/auth/login/2fa returns the full response.
 */
public record AuthResponse(String token, String tokenType, UserResponse user, boolean twoFactorRequired, String challengeToken) {

    public static AuthResponse of(String token, UserResponse user) {
        return new AuthResponse(token, "Bearer", user, false, null);
    }

    public static AuthResponse twoFactorChallenge(String challengeToken) {
        return new AuthResponse(null, null, null, true, challengeToken);
    }
}
