package com.applyiq.common;

import org.junit.jupiter.api.Test;
import org.springframework.validation.FieldError;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private static FieldError error(String field, String code, String message) {
        return new FieldError("request", field, null, false, new String[]{code}, null, message);
    }

    @Test
    void humanizesValidationErrors() {
        assertEquals("Please fill in the company name and job title.", GlobalExceptionHandler.humanize(List.of(
                error("jobTitle", "NotBlank", "must not be blank"),
                error("companyName", "NotBlank", "must not be blank"))));

        assertEquals("Please fill in the email. Please enter a valid recruiter email. Password must be at least 8 characters.",
                GlobalExceptionHandler.humanize(List.of(
                        error("email", "NotBlank", "must not be blank"),
                        error("recruiterEmail", "Email", "must be a well-formed email address"),
                        error("password", "Size", "password must be at least 8 characters"))));
    }
}
