package com.example.personal_budget.dto.request;
import java.time.LocalDate;


import com.example.personal_budget.enums.NotificationEventType;


public class GoalReminderEvent extends NotificationEvent {

    private final String goalName;

    private final LocalDate deadline;

    public GoalReminderEvent(
            Long userId,
            String goalName,
            LocalDate deadline
    ) {
        super(userId);
        this.goalName = goalName;
        this.deadline = deadline;
    }

    public String getGoalName() {
        return goalName;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    @Override
    public NotificationEventType getType() {
        return NotificationEventType.GOAL_REMINDER;
    }
}
