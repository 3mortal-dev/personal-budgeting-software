package com.example.personal_budget.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.personal_budget.dto.request.BudgetExceededLimitEvent;
import com.example.personal_budget.dto.request.BudgetNearLimitEvent;
import com.example.personal_budget.dto.request.GoalReminderEvent;
import com.example.personal_budget.dto.request.NotificationEvent;
import com.example.personal_budget.entity.Notification;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.NotificationEventType;
import com.example.personal_budget.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    private final UserService userService;

    public void createNotification(NotificationEvent event) {

        User user = userService.getUserById(event.getUserId());

        String message = buildMessage(event);

        Notification notification = Notification.builder()
                .user(user)
                .type(event.getType())
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);
    }

    public void markAsRead(Long notificationId) {

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void deleteNotification(Long notificationId) {

        if (!notificationRepository.existsById(notificationId)) {
            throw new RuntimeException("Notification not found");
        }

        notificationRepository.deleteById(notificationId);
    }

    public void deleteAllNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserId(userId);
        notificationRepository.deleteAll(notifications);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserId(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }

    public List<Notification> getNotificationsByType(Long userId, NotificationEventType type) {
        return notificationRepository.findByUserIdOrType(userId, type);
    }

    public List<Notification> getReceivedNotifications(Long userId, int limit) {
        List<Notification> notifications = notificationRepository.findByUserId(userId);
        return notifications.stream()
                .sorted((n1, n2) -> n2.getCreatedAt().compareTo(n1.getCreatedAt()))
                .limit(limit)
                .toList();
    }

    // helper function to build notification message based on event type
    private String buildMessage(NotificationEvent event) {

        if (event instanceof BudgetNearLimitEvent budgetEvent) {
			return String.format(
					"Your %s budget threshold is exceeded by %s",
					budgetEvent.getCategoryName(),
					budgetEvent.getExceededAmount()
			);
        }

        if (event instanceof BudgetExceededLimitEvent budgetEvent) {

            return String.format(
                    "Your %s budget exceeded by %s",
                    budgetEvent.getCategoryName(),
                    budgetEvent.getExceededAmount()
            );
        }

        if (event instanceof GoalReminderEvent goalEvent) {

            return String.format(
                    "Goal '%s' deadline is approaching on %s",
                    goalEvent.getGoalName(),
                    goalEvent.getDeadline()
            );
        }

        return "Notification";
    }
}
