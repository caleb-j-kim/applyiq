package com.applyiq.notifications;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Optional<Notification> findByIdAndUser_Id(UUID id, UUID userId);

    List<Notification> findAllByUser_Id(UUID userId, Sort sort);

    List<Notification> findAllByUser_IdAndReadFalse(UUID userId, Sort sort);

    long countByUser_IdAndReadFalse(UUID userId);
}
