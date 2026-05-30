package com.example.personal_budget.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.personal_budget.entity.Notification;
import com.example.personal_budget.enums.NotificationEventType;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Finds notifications owned by a user and matching the supplied event type.
     *
     * @param id the owner user id
     * @param type the event type to filter by
     * @return matching notifications
     */
    List<Notification> findByUserIdAndType(Long id, NotificationEventType type);

    /**
     * Finds notifications by event type.
     *
     * @param type the event type
     * @return matching notifications
     */
    List<Notification> findByType(NotificationEventType type);

    /**
     * Finds notifications owned by a user.
     *
     * @param id the owner user id
     * @return notifications for the user
     */
    List<Notification> findByUserId(Long id);

    /**
     * Finds a notification by id while enforcing user ownership.
     *
     * @param id the notification id
     * @param userID the owner user id
     * @return the matching notification when present
     */
    Optional<Notification> findByIdAndUserId(Long id, Long userID);

    /**
     * Finds unread notifications owned by a user.
     *
     * @param userId the owner user id
     * @return unread notifications
     */
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
}
