package com.applyiq.common;

public final class ValidationUtils {

    private static final int MIN_PASSWORD_LENGTH = 8;

    private ValidationUtils() {
    }

    public static boolean isStrongPassword(String password) {
        return password != null && password.length() >= MIN_PASSWORD_LENGTH;
    }
}
