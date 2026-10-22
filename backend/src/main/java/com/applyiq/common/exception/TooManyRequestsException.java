package com.applyiq.common.exception;

/** Mapped to 429 by GlobalExceptionHandler. */
public class TooManyRequestsException extends RuntimeException {

    public TooManyRequestsException(String message) {
        super(message);
    }
}
