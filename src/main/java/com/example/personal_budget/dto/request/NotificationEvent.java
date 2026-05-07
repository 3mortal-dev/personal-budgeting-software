package com.example.personal_budget.dto.request;

import com.example.personal_budget.enums.NotificationEventType;


public abstract class NotificationEvent {

    private final Long userId;

    protected NotificationEvent(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return userId;
    }

    public abstract NotificationEventType getType();
}