package com.applyiq.resumes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {

    Optional<Resume> findByIdAndUser_Id(UUID id, UUID userId);

    long countByUser_Id(UUID userId);

    List<Resume> findAllByUser_Id(UUID userId);

    List<Resume> findAllByUser_IdAndActiveTrue(UUID userId);

    Optional<Resume> findFirstByUser_IdOrderByCreatedAtDesc(UUID userId);

    void deleteAllByUser_Id(UUID userId);

    @Query("""
            SELECT new com.applyiq.resumes.ResumeResponse(r.id, r.fileName, r.contentType, r.fileSizeBytes, r.parsedText, r.active, r.createdAt, r.updatedAt)
            FROM Resume r
            WHERE r.user.id = :userId
            ORDER BY r.createdAt DESC
            """)
    List<ResumeResponse> listByUser(@Param("userId") UUID userId);
}
