package com.example.personal_budget.dto.request;

import java.math.BigDecimal;

import com.example.personal_budget.enums.NotificationEventType;

public class BudgetExceededLimitEvent extends NotificationEvent {

    private final String categoryName;

    private final BigDecimal exceededAmount;

    public BudgetExceededLimitEvent(Long userId, String categoryName, BigDecimal exceededAmount) {
        super(userId);
        this.categoryName = categoryName;
        this.exceededAmount = exceededAmount;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public BigDecimal getExceededAmount() {
        return exceededAmount;
    }

    @Override
    public NotificationEventType getType() {
        return NotificationEventType.BUDGET_EXCEEDED;
    }
}
