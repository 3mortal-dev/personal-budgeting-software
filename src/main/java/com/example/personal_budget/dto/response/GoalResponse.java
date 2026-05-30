package com.example.personal_budget.dto.response;

import com.example.personal_budget.entity.Goal;
import com.example.personal_budget.enums.GoalStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GoalResponse {

    private Long        id;
    private Long        userId;
    private String      name;
    private double      targetAmount;
    private double      savedAmount;
    private LocalDate   deadline;
    private GoalStatus  status;
    private boolean     completed;
    private String      iconClass;
    private String      iconColor;
    private String      currency;

    public GoalResponse() {}

    public GoalResponse(Goal goal, String currency) {
        this.id           = goal.getId();
        this.userId       = goal.getUser().getId();
        this.name         = goal.getGoalName();
        this.targetAmount = goal.getTargetAmount();
        this.savedAmount  = goal.getCurrentAmount();
        this.deadline     = goal.getDeadline();
        this.status       = goal.getStatus();
        this.iconClass    = goal.getIconClass();
        this.iconColor    = goal.getIconColor();
        this.currency     = currency;

        this.completed = goal.getStatus() == GoalStatus.EXCEEDED
                || (goal.getTargetAmount() > 0
                        && goal.getCurrentAmount() >= goal.getTargetAmount());
    }

    public GoalResponse(Goal goal) {
        this(goal, "USD");
    }
}
