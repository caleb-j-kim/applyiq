package com.applyiq.common;

import com.applyiq.common.exception.AiServiceException;
import com.applyiq.common.exception.EmailAlreadyExistsException;
import com.applyiq.common.exception.InvalidFileException;
import com.applyiq.common.exception.ResourceNotFoundException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(humanize(ex.getBindingResult().getFieldErrors())));
    }

    /**
     * Turns raw bean-validation output ("jobTitle: must not be blank, companyName: must not be blank")
     * into one readable sentence per problem ("Please fill in the company name and job title.").
     */
    static String humanize(List<FieldError> errors) {
        List<String> missing = new ArrayList<>();
        List<String> other = new ArrayList<>();
        for (FieldError error : errors) {
            String label = label(error.getField());
            String code = error.getCode() == null ? "" : error.getCode();
            switch (code) {
                case "NotBlank", "NotNull", "NotEmpty" -> missing.add(label);
                case "Email" -> other.add("Please enter a valid " + label + ".");
                default -> {
                    String detail = error.getDefaultMessage() == null ? "is invalid" : error.getDefaultMessage();
                    // Some constraints already name the field in their message ("password must be ...").
                    String sentence = detail.toLowerCase().startsWith(label) ? detail : label + " " + detail;
                    other.add(Character.toUpperCase(sentence.charAt(0)) + sentence.substring(1) + ".");
                }
            }
        }
        List<String> sentences = new ArrayList<>();
        if (!missing.isEmpty()) {
            sentences.add("Please fill in the " + joinWithAnd(missing.stream().distinct().sorted().toList()) + ".");
        }
        other.stream().distinct().forEach(sentences::add);
        return String.join(" ", sentences);
    }

    // "recruiterEmail" -> "recruiter email"
    private static String label(String field) {
        return field.replaceAll("([a-z0-9])([A-Z])", "$1 $2").toLowerCase();
    }

    private static String joinWithAnd(List<String> items) {
        if (items.size() <= 2) {
            return String.join(" and ", items);
        }
        return String.join(", ", items.subList(0, items.size() - 1)) + ", and " + items.getLast();
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidFile(InvalidFileException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error("File exceeds the maximum allowed size"));
    }

    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<ApiResponse<Void>> handleAiService(AiServiceException ex) {
        log.warn("AI service call failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid email or password"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred"));
    }
}
