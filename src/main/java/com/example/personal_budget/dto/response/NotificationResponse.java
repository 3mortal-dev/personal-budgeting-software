package com.example.personal_budget.dto.response;

import com.example.personal_budget.enums.NotificationEventType;

import lombok.Data;

@Data
public class NotificationResponse {
    private Long id;
    private NotificationEventType type;
    private String message;
    private boolean read;
    private String createdAt;
}
