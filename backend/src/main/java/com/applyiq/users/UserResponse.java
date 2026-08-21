package com.applyiq.users;

import java.util.UUID;

public record UserResponse(UUID id, String firstName, String lastName, String email) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail());
    }
}
