package com.applyiq.applications;

import com.applyiq.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "job_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    private String location;

    @Column(name = "job_url")
    private String jobUrl;

    // columnDefinition pins this to a plain varchar so Hibernate never generates a CHECK
    // constraint enumerating the enum's values — ddl-auto=update can't rewrite an existing
    // constraint when new ApplicationStatus values are added, so a generated one goes stale
    // and starts rejecting valid statuses the moment the enum grows.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(32)")
    private ApplicationStatus status;

    private String source;

    @Column(name = "date_applied")
    private LocalDate dateApplied;

    @Column(name = "last_contact_date")
    private LocalDate lastContactDate;

    @Column(name = "has_referral", nullable = false)
    private boolean hasReferral;

    @Column(name = "referral_name")
    private String referralName;

    @Column(name = "referral_relationship")
    private String referralRelationship;

    @Column(name = "referral_contact_info")
    private String referralContactInfo;

    @Column(name = "referral_date")
    private LocalDate referralDate;

    @Column(name = "referral_notes", columnDefinition = "TEXT")
    private String referralNotes;

    @Column(name = "recruiter_name")
    private String recruiterName;

    @Column(name = "recruiter_email")
    private String recruiterEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level")
    private PriorityLevel priorityLevel;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "follow_up_count", nullable = false)
    private int followUpCount;

    // Only meaningful while status is INTERVIEWING, but deliberately not cleared on other
    // status transitions (Offer/Rejected/etc.) — the interview rate is history-based, so this
    // needs to survive the application moving on. It's only ever cleared if the status goes
    // back to APPLIED (see JobApplicationService), which discards the interview history.
    @Column(name = "interview_rounds_total")
    private Integer interviewRoundsTotal;

    @Column(name = "interview_rounds_completed")
    private Integer interviewRoundsCompleted;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_stage", columnDefinition = "varchar(32)")
    private InterviewStage interviewStage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
