package com.applyiq.resumes;

import com.applyiq.auth.UserPrincipal;
import com.applyiq.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ResumeResponse> upload(@AuthenticationPrincipal UserPrincipal principal,
                                                @RequestParam("file") MultipartFile file) {
        Resume resume = resumeService.upload(principal.getUser().getId(), file);
        return ApiResponse.success(ResumeResponse.from(resume));
    }

    @GetMapping
    public ApiResponse<List<ResumeResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(resumeService.list(principal.getUser().getId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<ResumeResponse> getOne(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        Resume resume = resumeService.getOwned(principal.getUser().getId(), id);
        return ApiResponse.success(ResumeResponse.from(resume));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        UUID userId = principal.getUser().getId();
        Resume resume = resumeService.getOwned(userId, id);
        byte[] content = resumeService.download(userId, id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resume.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(resume.getFileName()).build().toString())
                .body(content);
    }

    @PatchMapping("/{id}/active")
    public ApiResponse<ResumeResponse> setActive(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        Resume resume = resumeService.setActive(principal.getUser().getId(), id);
        return ApiResponse.success(ResumeResponse.from(resume));
    }

    /**
     * (Re-)extracts plain text from the stored file into parsed_text. Match-score analysis
     * also does this lazily and automatically when text is missing (see ResumeMatchService),
     * so calling this explicitly isn't required to analyze a resume — it's here so the
     * frontend can process a resume up front (e.g. right after upload, or as a manual "retry"
     * action) and show the user whether it actually produced usable text.
     */
    @PostMapping("/{id}/extract-text")
    public ApiResponse<ResumeResponse> extractText(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        Resume resume = resumeService.extractText(principal.getUser().getId(), id);
        return ApiResponse.success(ResumeResponse.from(resume));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        resumeService.delete(principal.getUser().getId(), id);
        return ApiResponse.success(null);
    }
}
