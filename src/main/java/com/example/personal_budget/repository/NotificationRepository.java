package com.example.personal_budget.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.personal_budget.entity.Notification;
import com.example.personal_budget.enums.NotificationEventType;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrType(Long id, NotificationEventType type);

    List<Notification> findByType(NotificationEventType type);

    List<Notification> findByUserId(Long id);

    Optional<Notification> findByIdAndUserId(Long id, Long userID);

    List<Notification> findByUserIdAndIsReadFalse(Long userId);
}
