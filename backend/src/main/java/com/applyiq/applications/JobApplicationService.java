package com.applyiq.applications;

import com.applyiq.common.exception.ResourceNotFoundException;
import com.applyiq.users.User;
import com.applyiq.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final UserService userService;

    public JobApplication create(UUID userId, JobApplicationCreateRequest request) {
        User user = userService.getById(userId);
        JobApplication application = JobApplication.builder()
                .user(user)
                .companyName(request.companyName())
                .jobTitle(request.jobTitle())
                .location(request.location())
                .jobUrl(request.jobUrl())
                .status(request.status())
                .source(request.source())
                .dateApplied(request.dateApplied())
                .lastContactDate(request.lastContactDate())
                .hasReferral(Boolean.TRUE.equals(request.hasReferral()))
                .referralName(request.referralName())
                .referralRelationship(request.referralRelationship())
                .referralContactInfo(request.referralContactInfo())
                .referralDate(request.referralDate())
                .referralNotes(request.referralNotes())
                .recruiterName(request.recruiterName())
                .recruiterEmail(request.recruiterEmail())
                .priorityLevel(request.priorityLevel())
                .jobDescription(request.jobDescription())
                .notes(request.notes())
                .followUpCount(0)
                .interviewRoundsTotal(request.interviewRoundsTotal())
                .interviewRoundsCompleted(request.interviewRoundsCompleted())
                .interviewStage(request.interviewStage())
                .build();
        discardInterviewProgressIfApplied(application);
        return jobApplicationRepository.save(application);
    }

    public List<JobApplication> list(UUID userId, ApplicationStatus status, String search) {
        Specification<JobApplication> spec = (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("companyName")), pattern),
                    cb.like(cb.lower(root.get("jobTitle")), pattern)));
        }

        Sort sort = Sort.by(Sort.Direction.DESC, "dateApplied").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        return jobApplicationRepository.findAll(spec, sort);
    }

    public JobApplication getOwned(UUID userId, UUID applicationId) {
        return jobApplicationRepository.findByIdAndUser_Id(applicationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("No job application found with id " + applicationId));
    }

    public JobApplication update(UUID userId, UUID applicationId, JobApplicationUpdateRequest request) {
        JobApplication application = getOwned(userId, applicationId);

        if (request.companyName() != null) application.setCompanyName(request.companyName());
        if (request.jobTitle() != null) application.setJobTitle(request.jobTitle());
        if (request.location() != null) application.setLocation(request.location());
        if (request.jobUrl() != null) application.setJobUrl(request.jobUrl());
        if (request.status() != null) application.setStatus(request.status());
        if (request.source() != null) application.setSource(request.source());
        if (request.dateApplied() != null) application.setDateApplied(request.dateApplied());
        if (request.lastContactDate() != null) application.setLastContactDate(request.lastContactDate());
        if (request.hasReferral() != null) application.setHasReferral(request.hasReferral());
        if (request.referralName() != null) application.setReferralName(request.referralName());
        if (request.referralRelationship() != null) application.setReferralRelationship(request.referralRelationship());
        if (request.referralContactInfo() != null) application.setReferralContactInfo(request.referralContactInfo());
        if (request.referralDate() != null) application.setReferralDate(request.referralDate());
        if (request.referralNotes() != null) application.setReferralNotes(request.referralNotes());
        if (request.recruiterName() != null) application.setRecruiterName(request.recruiterName());
        if (request.recruiterEmail() != null) application.setRecruiterEmail(request.recruiterEmail());
        if (request.priorityLevel() != null) application.setPriorityLevel(request.priorityLevel());
        if (request.jobDescription() != null) application.setJobDescription(request.jobDescription());
        if (request.notes() != null) application.setNotes(request.notes());
        if (request.interviewRoundsTotal() != null) application.setInterviewRoundsTotal(request.interviewRoundsTotal());
        if (request.interviewRoundsCompleted() != null) application.setInterviewRoundsCompleted(request.interviewRoundsCompleted());
        if (request.interviewStage() != null) application.setInterviewStage(request.interviewStage());

        discardInterviewProgressIfApplied(application);
        return jobApplicationRepository.save(application);
    }

    public JobApplication updateStatus(UUID userId, UUID applicationId, ApplicationStatus status) {
        JobApplication application = getOwned(userId, applicationId);
        application.setStatus(status);
        discardInterviewProgressIfApplied(application);
        return jobApplicationRepository.save(application);
    }

    // An application moving back to APPLIED is a deliberate reset (e.g. someone testing the
    // app, or correcting a mistaken entry) — its interview history no longer counts, so the
    // recorded rounds/stage are discarded rather than left to keep inflating the interview rate.
    private void discardInterviewProgressIfApplied(JobApplication application) {
        if (application.getStatus() == ApplicationStatus.APPLIED) {
            application.setInterviewRoundsTotal(null);
            application.setInterviewRoundsCompleted(null);
            application.setInterviewStage(null);
        }
    }

    public void delete(UUID userId, UUID applicationId) {
        JobApplication application = getOwned(userId, applicationId);
        jobApplicationRepository.delete(application);
    }
}
