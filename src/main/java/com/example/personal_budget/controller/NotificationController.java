package com.example.personal_budget.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.personal_budget.dto.response.NotificationResponse;
import com.example.personal_budget.entity.Notification;
import com.example.personal_budget.enums.NotificationEventType;
import com.example.personal_budget.service.NotificationService;
import com.example.personal_budget.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private final UserService userService;

    /**
     * Lists all notifications for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return all user notifications
     */
    @GetMapping("/all")
    public ResponseEntity<List<NotificationResponse>> getAllNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserId(userDetails);
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        List<NotificationResponse> response = ResponseMapper(notifications);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists the most recent notifications for the authenticated user.
     *
     * @param limit the maximum number of notifications to return
     * @param userDetails the authenticated principal
     * @return recent notifications
     */
    @GetMapping("/recent")
    public ResponseEntity<List<NotificationResponse>> getRecentNotifications(
            @RequestParam int limit,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserId(userDetails);
        List<Notification> notifications = notificationService.getReceivedNotifications(userId, limit);
        List<NotificationResponse> response = ResponseMapper(notifications);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists unread notifications for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return unread notifications
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserId(userDetails);
        List<Notification> notifications = notificationService.getUnreadNotifications(userId);
        List<NotificationResponse> response = ResponseMapper(notifications);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists notifications for the authenticated user filtered by event type.
     *
     * @param type the notification type to filter by
     * @param userDetails the authenticated principal
     * @return matching notifications
     */
    @GetMapping("/type")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByType(
            @RequestParam NotificationEventType type,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userService.getUserId(userDetails);

        List<Notification> notifications = notificationService.getNotificationsByType(userId, type);

        List<NotificationResponse> response = ResponseMapper(notifications);

        return ResponseEntity.ok(response);
    }

    /**
     * Marks a notification as read.
     *
     * @param id the notification id
     * @return an empty success response
     */
    @PutMapping("{id}/markRead")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserId(userDetails);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Deletes a notification by id.
     *
     * @param id the notification id
     * @return an empty success response
     */
    @DeleteMapping("{id}/delete")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Deletes all notifications for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return an empty success response
     */
    @DeleteMapping("/deleteAll")
    public ResponseEntity<Void> deleteAllNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserId(userDetails);
        notificationService.deleteAllNotifications(userId);
        return ResponseEntity.ok().build();
    }

    // Mapper function to convert Notification entities to NotificationResponse DTOs
    private List<NotificationResponse> ResponseMapper(List<Notification> notifications) {
        return notifications.stream().map(notification -> {
            NotificationResponse response = new NotificationResponse();
            response.setId(notification.getId());
            response.setType(notification.getType());
            response.setMessage(notification.getMessage());
            response.setRead(notification.isRead());
            response.setCreatedAt(notification.getCreatedAt().toString());
            return response;
        }).toList();
    }
}
