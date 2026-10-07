package com.applyiq.ai;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Mirrors the frontend's MatchAnalysisResult shape (frontend/src/lib/mock-match-analysis.ts)
 * plus the fields only a real backend can provide (rationale, bullets, persistence id) —
 * deliberately kept close so swapping the frontend's mock call for a real fetch is close to
 * a drop-in field rename, not a redesign.
 */
public record MatchAnalysisResponse(
        UUID id,
        UUID resumeId,
        UUID jobApplicationId,
        int matchScore,
        List<ScoredKeyword> jdKeywords,
        List<ScoredKeyword> foundInResume,
        List<ScoredKeyword> missed,
        List<ScoredKeyword> predictedFound,
        List<ScoredKeyword> predictedMissed,
        String scoreRationale,
        List<String> suggestedResumeBullets,
        Instant createdAt
) {

    public static MatchAnalysisResponse from(ResumeMatchAnalysis analysis) {
        return new MatchAnalysisResponse(
                analysis.getId(),
                analysis.getResume().getId(),
                analysis.getJobApplication() != null ? analysis.getJobApplication().getId() : null,
                analysis.getMatchScore(),
                analysis.getJobDescriptionKeywords(),
                analysis.getFoundKeywords(),
                analysis.getMissingKeywords(),
                analysis.getPredictedFoundKeywords(),
                analysis.getPredictedMissingKeywords(),
                analysis.getScoreRationale(),
                analysis.getSuggestedResumeBullets(),
                analysis.getCreatedAt()
        );
    }
}
