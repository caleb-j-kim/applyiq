package com.applyiq.notifications;

import com.applyiq.applications.JobApplication;
import com.applyiq.applications.JobApplicationService;
import com.applyiq.common.exception.ResourceNotFoundException;
import com.applyiq.users.User;
import com.applyiq.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt");

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final JobApplicationService jobApplicationService;

    public Notification create(UUID userId, NotificationCreateRequest request) {
        User user = userService.getById(userId);
        JobApplication jobApplication = request.jobApplicationId() != null
                ? jobApplicationService.getOwned(userId, request.jobApplicationId())
                : null;

        Notification notification = Notification.builder()
                .user(user)
                .jobApplication(jobApplication)
                .type(request.type())
                .title(request.title())
                .message(request.message())
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> list(UUID userId, boolean unreadOnly) {
        return unreadOnly
                ? notificationRepository.findAllByUser_IdAndReadFalse(userId, NEWEST_FIRST)
                : notificationRepository.findAllByUser_Id(userId, NEWEST_FIRST);
    }

    public Notification getOwned(UUID userId, UUID notificationId) {
        return notificationRepository.findByIdAndUser_Id(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("No notification found with id " + notificationId));
    }

    public long unreadCount(UUID userId) {
        return notificationRepository.countByUser_IdAndReadFalse(userId);
    }

    public Notification markRead(UUID userId, UUID notificationId) {
        Notification notification = getOwned(userId, notificationId);
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllRead(UUID userId) {
        List<Notification> unread = notificationRepository.findAllByUser_IdAndReadFalse(userId, NEWEST_FIRST);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void delete(UUID userId, UUID notificationId) {
        Notification notification = getOwned(userId, notificationId);
        notificationRepository.delete(notification);
    }
}
