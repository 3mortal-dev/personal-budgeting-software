package com.example.personal_budget.dto.request;

import lombok.Data;

@Data
public class UpdateNotificationSettings {
    private boolean budgetAlerts;
    private boolean goalReminders;
}
