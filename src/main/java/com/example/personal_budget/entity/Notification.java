package com.example.personal_budget.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

import java.time.LocalDateTime;
import com.example.personal_budget.enums.NotificationEventType;

@Entity
@Data
public class Notification {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String message;

    private NotificationEventType type;
    
    private boolean isRead;

    private LocalDateTime createdAt;
}
