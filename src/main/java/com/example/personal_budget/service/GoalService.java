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


    private void assertOwner(Goal goal, long userId) {
        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
    }

    /**
     * Adds a new financial goal for the user.
     *
     * @param request the details of the goal to add
     * @param userId the owner user id
     * @return the created goal with its initial status
     */
    public Goal addGoal(GoalRequest request, long userId) {
        double target = (request.getTargetAmount() != null ? request.getTargetAmount() : 0.0);

        Goal goal = new Goal();
        goal.setUser(userService.getUserById(userId));
        goal.setGoalName(request.getGoalName());
        goal.setTargetAmount(target);
        goal.setCurrentAmount(0.0);
        goal.setDeadline(request.getDeadline());
        goal.setIconClass(request.getIconClass());
        goal.setIconColor(request.getIconColor());

        goal.setStatus(calculateStatus(0.0, target));

        return goalRepository.save(goal);
    }

    /**
     * Updates an existing goal after verifying ownership.
     *
     * @param id the goal id
     * @param request the requested goal changes
     * @param userId the authenticated user's id
     * @return the updated goal
     */
    public Goal editGoal(long id, GoalRequest request, long userId) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        assertOwner(goal, userId);

        double saved = goal.getCurrentAmount();
        double target = (request.getTargetAmount() != null ? request.getTargetAmount() : goal.getTargetAmount());

        goal.setGoalName(request.getGoalName());
        goal.setTargetAmount(target);
        goal.setDeadline(request.getDeadline());
        goal.setIconClass(request.getIconClass());
        goal.setIconColor(request.getIconColor());

        goal.setStatus(calculateStatus(saved, target));

        return goalRepository.save(goal);
    }

    /**
     * Loads a goal by id after verifying ownership.
     *
     * @param id the goal id
     * @param userId the authenticated user's id
     * @return the matching goal
     */
    public Goal getGoalById(long id, long userId) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        assertOwner(goal, userId);
        return goal;
    }

    /**
     * Replaces the saved progress amount for a goal and recalculates its status.
     *
     * @param id the goal id
     * @param amount the new saved amount
     * @param userId the authenticated user's id
     * @return the updated goal
     */
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

    /**
     * Deletes a goal after verifying ownership.
     *
     * @param id the goal id
     * @param userId the authenticated user's id
     */
    public void deleteGoal(long id, long userId) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        assertOwner(goal, userId);
        goalRepository.delete(goal);
    }

    /**
     * Retrieves all goals owned by a user.
     *
     * @param userId the owner user id
     * @return the user's goals
     */
    public List<Goal> getGoalsByUserId(long userId) {
        return goalRepository.findByUserId(userId);
    }

    /**
     * Counts goals that are still active for dashboard display.
     *
     * @param userId the owner user id
     * @return the count of on-track or near-limit goals
     */
    public Integer getActiveGoalsCount(long userId) {
        return goalRepository.countByUserIdAndStatusIn(
                userId,
                List.of(GoalStatus.ONTRACK, GoalStatus.NEARLIMIT)
        );
    }
}
