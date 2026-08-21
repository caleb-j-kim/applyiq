package com.applyiq.resumes;

import java.time.Instant;
import java.util.UUID;

public record ResumeResponse(
        UUID id,
        String fileName,
        String contentType,
        long fileSizeBytes,
        String parsedText,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static ResumeResponse from(Resume resume) {
        return new ResumeResponse(
                resume.getId(),
                resume.getFileName(),
                resume.getContentType(),
                resume.getFileSizeBytes(),
                resume.getParsedText(),
                resume.isActive(),
                resume.getCreatedAt(),
                resume.getUpdatedAt()
        );
    }
}
