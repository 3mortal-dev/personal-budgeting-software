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

    @GetMapping("/all")
    public ResponseEntity<List<NotificationResponse>> getAllNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserId(userDetails);
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        List<NotificationResponse> response = ResponseMapper(notifications);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<NotificationResponse>> getRecentNotifications(
            @RequestParam int limit,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserId(userDetails);
        List<Notification> notifications = notificationService.getReceivedNotifications(userId, limit);
        List<NotificationResponse> response = ResponseMapper(notifications);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserId(userDetails);
        List<Notification> notifications = notificationService.getUnreadNotifications(userId);
        List<NotificationResponse> response = ResponseMapper(notifications);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/type")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByType(
            @RequestParam NotificationEventType type,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userService.getUserId(userDetails);

        List<Notification> notifications = notificationService.getNotificationsByType(userId, type);

        List<NotificationResponse> response = ResponseMapper(notifications);

        return ResponseEntity.ok(response);
    }

    @PutMapping("{id}/markRead")
    public ResponseEntity markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("{id}/delete")
    public ResponseEntity deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/deleteAll")
    public ResponseEntity deleteAllNotifications(@AuthenticationPrincipal UserDetails userDetails) {
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
