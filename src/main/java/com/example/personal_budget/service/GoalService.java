package com.example.personal_budget.service;

import com.example.personal_budget.dto.request.GoalRequest;
import com.example.personal_budget.entity.Goal;
import com.example.personal_budget.enums.GoalStatus;
import com.example.personal_budget.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserService userService;

    // ─────────────────────────────────────────────────────────────
    // Status helper — single source of truth for status calculation.
    // Used by addGoal, editGoal, and updateProgress so they all
    // apply identical thresholds.
    // ─────────────────────────────────────────────────────────────
    private GoalStatus calculateStatus(double saved, double target) {
        if (target <= 0) {
            return GoalStatus.ONTRACK;
        }
        double ratio = saved / target;
        if (ratio >= 1.0) {
            return GoalStatus.EXCEEDED;
        }
        if (ratio >= 0.8) {
            return GoalStatus.NEARLIMIT;
        }
        return GoalStatus.ONTRACK;
    }

    // ─────────────────────────────────────────────────────────────
    // Ownership guard — reused in every mutating method.
    // ─────────────────────────────────────────────────────────────
    private void assertOwner(Goal goal, long userId) {
        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
    }

    /*
	 * Adds a new financial goal for the user.
	 *
	 * @param request  the details of the goal to be added, including name, target amount, deadline, etc.
	 * @param userId   the ID of the user to whom the goal belongs
	 * @return the created Goal entity with all details filled in, including calculated status
     */
    public Goal addGoal(GoalRequest request, long userId) {
        double saved = (request.getSavedAmount() != null ? request.getSavedAmount() : 0.0);
        double target = (request.getTargetAmount() != null ? request.getTargetAmount() : 0.0);

        Goal goal = new Goal();
        goal.setUser(userService.getUserById(userId));
        goal.setGoalName(request.getGoalName());
        goal.setTargetAmount(target);
        goal.setCurrentAmount(saved);
        goal.setDeadline(request.getDeadline());
        goal.setIconClass(request.getIconClass());
        goal.setIconColor(request.getIconColor());

        // FIX: status must reflect the initial amounts, not always ONTRACK.
        // A goal created already at 100% should immediately show as EXCEEDED.
        goal.setStatus(calculateStatus(saved, target));

        return goalRepository.save(goal);
    }

    public Goal editGoal(long id, GoalRequest request, long userId) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        assertOwner(goal, userId);

        double saved = (request.getSavedAmount() != null ? request.getSavedAmount() : goal.getCurrentAmount());
        double target = (request.getTargetAmount() != null ? request.getTargetAmount() : goal.getTargetAmount());

        goal.setGoalName(request.getGoalName());
        goal.setTargetAmount(target);
        goal.setCurrentAmount(saved);
        goal.setDeadline(request.getDeadline());
        goal.setIconClass(request.getIconClass());
        goal.setIconColor(request.getIconColor());

        // FIX: recalculate status whenever amounts change.
        // Previously status was never updated on edit, so a goal
        // edited to 100% would still show ONTRACK in the response.
        goal.setStatus(calculateStatus(saved, target));

        return goalRepository.save(goal);
    }

    public Goal getGoalById(long id, long userId) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        assertOwner(goal, userId);
        return goal;
    }

    public Goal updateProgress(long id, double amount, long userId) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        assertOwner(goal, userId);

        if (goal.getTargetAmount() <= 0) {
            throw new RuntimeException("Invalid target amount");
        }

        goal.setCurrentAmount(amount);
        goal.setStatus(calculateStatus(amount, goal.getTargetAmount()));

        return goalRepository.save(goal);
    }

    public void deleteGoal(long id, long userId) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        assertOwner(goal, userId);
        goalRepository.delete(goal);
    }

    public List<Goal> getGoalsByUserId(long userId) {
        return goalRepository.findByUserId(userId);
    }

    // FIX: count both ONTRACK and NEARLIMIT as "active".
    // NEARLIMIT goals (80–99%) are not completed — they are active.
    // Previously only ONTRACK was counted, so the summary badge was wrong.
    public Integer getActiveGoalsCount(long userId) {
        return goalRepository.countByUserIdAndStatusIn(
                userId,
                List.of(GoalStatus.ONTRACK, GoalStatus.NEARLIMIT)
        );
    }
}
