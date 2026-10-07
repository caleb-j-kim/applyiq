package com.applyiq.ai;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResumeMatchAnalysisRepository extends JpaRepository<ResumeMatchAnalysis, UUID> {

    Optional<ResumeMatchAnalysis> findFirstByJobApplication_IdAndUser_IdOrderByCreatedAtDesc(UUID jobApplicationId, UUID userId);

    Optional<ResumeMatchAnalysis> findByIdAndUser_Id(UUID id, UUID userId);
}
