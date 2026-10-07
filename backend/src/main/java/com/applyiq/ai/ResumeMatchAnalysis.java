package com.applyiq.ai;

import com.applyiq.applications.JobApplication;
import com.applyiq.resumes.Resume;
import com.applyiq.users.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * One persisted resume-to-job match analysis. The keyword list columns store
 * JSON text rather than a normalized child table — these are small,
 * write-once, read-as-a-whole blobs with no query need to filter by
 * individual keyword, so a normalized table would just add joins for no
 * benefit. {@code jobApplication} is nullable: a "preview" analysis (job
 * description pasted ad hoc, not yet saved as a tracked application) is
 * still persisted for the user's history and cost auditing, just without a
 * tracked-application link.
 */
@Entity
@Table(name = "resume_match_analyses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeMatchAnalysis {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Nullable FK: deleting the application should orphan this record, not destroy it - the
    // analysis is still meaningful history even once the tracked application is gone.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_application_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private JobApplication jobApplication;

    // Required FK: an analysis with no resume to point to isn't meaningful on its own, so
    // deleting the resume takes its analyses with it rather than leaving an orphaned row
    // ResumeService.delete() (or anything else) can't ever satisfy.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resume_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Resume resume;

    @Column(name = "match_score", nullable = false)
    private int matchScore;

    @Column(name = "job_description_keywords", columnDefinition = "TEXT")
    private String jobDescriptionKeywordsJson;

    @Column(name = "found_keywords", columnDefinition = "TEXT")
    private String foundKeywordsJson;

    @Column(name = "missing_keywords", columnDefinition = "TEXT")
    private String missingKeywordsJson;

    @Column(name = "predicted_found_keywords", columnDefinition = "TEXT")
    private String predictedFoundKeywordsJson;

    @Column(name = "predicted_missing_keywords", columnDefinition = "TEXT")
    private String predictedMissingKeywordsJson;

    @Column(name = "score_rationale", columnDefinition = "TEXT")
    private String scoreRationale;

    @Column(name = "suggested_resume_bullets", columnDefinition = "TEXT")
    private String suggestedResumeBulletsJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public void setJobDescriptionKeywords(List<ScoredKeyword> keywords) {
        this.jobDescriptionKeywordsJson = writeJson(keywords);
    }

    public void setFoundKeywords(List<ScoredKeyword> keywords) {
        this.foundKeywordsJson = writeJson(keywords);
    }

    public void setMissingKeywords(List<ScoredKeyword> keywords) {
        this.missingKeywordsJson = writeJson(keywords);
    }

    public void setPredictedFoundKeywords(List<ScoredKeyword> keywords) {
        this.predictedFoundKeywordsJson = writeJson(keywords);
    }

    public void setPredictedMissingKeywords(List<ScoredKeyword> keywords) {
        this.predictedMissingKeywordsJson = writeJson(keywords);
    }

    public void setSuggestedResumeBullets(List<String> bullets) {
        this.suggestedResumeBulletsJson = writeJson(bullets);
    }

    public List<ScoredKeyword> getJobDescriptionKeywords() {
        return readKeywordsJson(jobDescriptionKeywordsJson);
    }

    public List<ScoredKeyword> getFoundKeywords() {
        return readKeywordsJson(foundKeywordsJson);
    }

    public List<ScoredKeyword> getMissingKeywords() {
        return readKeywordsJson(missingKeywordsJson);
    }

    public List<ScoredKeyword> getPredictedFoundKeywords() {
        return readKeywordsJson(predictedFoundKeywordsJson);
    }

    public List<ScoredKeyword> getPredictedMissingKeywords() {
        return readKeywordsJson(predictedMissingKeywordsJson);
    }

    public List<String> getSuggestedResumeBullets() {
        if (suggestedResumeBulletsJson == null) {
            return List.of();
        }
        try {
            return JSON.readValue(suggestedResumeBulletsJson, JSON.getTypeFactory()
                    .constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return List.of();
        }
    }

    private static List<ScoredKeyword> readKeywordsJson(String json) {
        if (json == null) {
            return List.of();
        }
        try {
            return JSON.readValue(json, JSON.getTypeFactory()
                    .constructCollectionType(List.class, ScoredKeyword.class));
        } catch (Exception e) {
            return List.of();
        }
    }

    private static String writeJson(Object value) {
        try {
            return JSON.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize keyword list", e);
        }
    }
}
