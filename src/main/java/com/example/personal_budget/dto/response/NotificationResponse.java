package com.example.personal_budget.dto.response;

import lombok.Data;

@Data
public class NotificationResponse {
    private Long id;
    private String type;
    private String message;
    private boolean read;
    private String createdAt;
}
