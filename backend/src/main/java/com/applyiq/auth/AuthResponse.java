package com.applyiq.auth;

import com.applyiq.users.UserResponse;

public record AuthResponse(String token, String tokenType, UserResponse user) {

    public static AuthResponse of(String token, UserResponse user) {
        return new AuthResponse(token, "Bearer", user);
    }
}
