package com.example.personal_budget.dto.response;

import com.example.personal_budget.entity.Goal;
import com.example.personal_budget.enums.GoalStatus;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class GoalResponse {

    private final Long        id;
    private final Long        userId;
    private final String      name;
    private final double      targetAmount;
    private final double      savedAmount;
    private final LocalDate   deadline;
    private final GoalStatus  status;
    private final boolean     completed;
    private final String      iconClass;
    private final String      iconColor;

    public GoalResponse(Goal goal) {
        this.id           = goal.getId();
        this.userId       = goal.getUser().getId();
        this.name         = goal.getGoalName();
        this.targetAmount = goal.getTargetAmount();
        this.savedAmount  = goal.getCurrentAmount();
        this.deadline     = goal.getDeadline();
        this.status       = goal.getStatus();
        this.iconClass    = goal.getIconClass();
        this.iconColor    = goal.getIconColor();

        // FIX: previously only EXCEEDED was treated as completed.
        // Now we also guard against a null status (defensive) and
        // check the saved/target ratio directly so a goal edited to
        // >= 100% always shows completed even if status wasn't recalculated.
        this.completed = goal.getStatus() == GoalStatus.EXCEEDED
                || (goal.getTargetAmount() > 0
                        && goal.getCurrentAmount() >= goal.getTargetAmount());
    }
}