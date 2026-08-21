package com.applyiq.applications;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID>,
        JpaSpecificationExecutor<JobApplication> {

    Optional<JobApplication> findByIdAndUser_Id(UUID id, UUID userId);

    void deleteAllByUser_Id(UUID userId);
}
