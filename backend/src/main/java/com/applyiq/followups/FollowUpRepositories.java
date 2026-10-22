package com.applyiq.followups;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// The follow-ups module's three small repositories, kept together since each is a couple of lines.
interface FollowUpDraftRepository extends JpaRepository<FollowUpDraft, UUID> {

    List<FollowUpDraft> findAllByUser_Id(UUID userId, Sort sort);

    Optional<FollowUpDraft> findByIdAndUser_Id(UUID id, UUID userId);
}

interface ManualFollowUpRepository extends JpaRepository<ManualFollowUp, UUID> {

    List<ManualFollowUp> findAllByUser_Id(UUID userId, Sort sort);

    Optional<ManualFollowUp> findByIdAndUser_Id(UUID id, UUID userId);
}

interface FollowUpDismissalRepository extends JpaRepository<FollowUpDismissal, UUID> {

    List<FollowUpDismissal> findAllByUserId(UUID userId);

    boolean existsByUserIdAndJobApplicationIdAndRecommendedAction(UUID userId, UUID jobApplicationId, String recommendedAction);
}
