package com.applyiq.ai;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InterviewPrepRepository extends JpaRepository<InterviewPrep, UUID> {

    Optional<InterviewPrep> findByIdAndUser_Id(UUID id, UUID userId);

    List<InterviewPrep> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    void deleteAllByUser_Id(UUID userId);
}
