package com.applyiq.resumes;

import com.applyiq.common.exception.InvalidFileException;
import com.applyiq.common.exception.ResourceNotFoundException;
import com.applyiq.storage.ResumeStorageService;
import com.applyiq.users.User;
import com.applyiq.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    private final ResumeRepository resumeRepository;
    private final UserService userService;
    private final ResumeStorageService resumeStorageService;

    public Resume upload(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Resume file is required");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new InvalidFileException("Resume file must be 5MB or smaller");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new InvalidFileException("Resume must be a PDF or Word document");
        }

        User user = userService.getById(userId);
        boolean isFirstResume = resumeRepository.countByUser_Id(userId) == 0;

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read uploaded resume file", e);
        }

        String storageKey = resumeStorageService.newKey(userId);
        resumeStorageService.upload(storageKey, content, file.getContentType());

        Resume resume = Resume.builder()
                .user(user)
                .fileName(file.getOriginalFilename())
                .contentType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .storageKey(storageKey)
                .active(isFirstResume)
                .build();
        return resumeRepository.save(resume);
    }

    public byte[] download(UUID userId, UUID resumeId) {
        Resume resume = getOwned(userId, resumeId);
        return resumeStorageService.download(resume.getStorageKey());
    }

    public List<ResumeResponse> list(UUID userId) {
        return resumeRepository.listByUser(userId);
    }

    public Resume getOwned(UUID userId, UUID resumeId) {
        return resumeRepository.findByIdAndUser_Id(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("No resume found with id " + resumeId));
    }

    public Resume setActive(UUID userId, UUID resumeId) {
        Resume resume = getOwned(userId, resumeId);

        List<Resume> currentlyActive = resumeRepository.findAllByUser_IdAndActiveTrue(userId);
        currentlyActive.forEach(r -> r.setActive(false));
        resumeRepository.saveAll(currentlyActive);

        resume.setActive(true);
        return resumeRepository.save(resume);
    }

    public void delete(UUID userId, UUID resumeId) {
        Resume resume = getOwned(userId, resumeId);
        boolean wasActive = resume.isActive();
        resumeRepository.delete(resume);
        resumeStorageService.delete(resume.getStorageKey());

        if (wasActive) {
            resumeRepository.findFirstByUser_IdOrderByCreatedAtDesc(userId)
                    .ifPresent(next -> {
                        next.setActive(true);
                        resumeRepository.save(next);
                    });
        }
    }
}
