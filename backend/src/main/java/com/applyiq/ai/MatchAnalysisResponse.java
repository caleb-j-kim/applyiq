package com.applyiq.ai;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** One match analysis as returned to the frontend (MatchAnalysisResponseDto in frontend/src/lib/mappers.ts). */
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
