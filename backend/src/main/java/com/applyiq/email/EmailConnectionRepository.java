package com.applyiq.email;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailConnectionRepository extends JpaRepository<EmailConnection, UUID> {

    List<EmailConnection> findAllByUser_Id(UUID userId);

    Optional<EmailConnection> findByUser_IdAndProvider(UUID userId, EmailProvider provider);
}
