package com.applyiq.ai;

import com.applyiq.applications.JobApplication;
import com.applyiq.users.User;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A saved interview prep. Company, title and resume name are copied in as text so the prep
 * still reads correctly after its application or resume is deleted; sections are one JSON
 * blob for the same reason as {@link ResumeMatchAnalysis}'s keyword lists.
 */
@Entity
@Table(name = "interview_preps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewPrep {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_application_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private JobApplication jobApplication;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "resume_name")
    private String resumeName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrepEffort effort;

    @Column(name = "sections", columnDefinition = "TEXT", nullable = false)
    private String sectionsJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public void setSections(List<InterviewPrepResponse.Section> sections) {
        try {
            this.sectionsJson = JSON.writeValueAsString(sections);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize interview prep sections", e);
        }
    }

    public List<InterviewPrepResponse.Section> getSections() {
        try {
            return JSON.readValue(sectionsJson, JSON.getTypeFactory()
                    .constructCollectionType(List.class, InterviewPrepResponse.Section.class));
        } catch (Exception e) {
            return List.of();
        }
    }
}
