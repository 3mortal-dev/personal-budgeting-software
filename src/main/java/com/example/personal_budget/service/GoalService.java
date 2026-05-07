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

    public Goal addGoal(
            GoalRequest request,
            long userId) {
        Goal goal = new Goal();
        goal.setUserId(userId);
        goal.setGoalName(request.getGoalName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setDeadline(request.getDeadline());
        goal.setCurrentAmount(0.0);
        goal.setStatus(GoalStatus.ONTRACK);
        return goalRepository.save(goal);
    }

    public Goal editGoal(
            long id,
            GoalRequest request,
            long userId) {

        Goal goal = goalRepository.findById(id).orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        goal.setGoalName(request.getGoalName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setDeadline(request.getDeadline());

        return goalRepository.save(goal);
    }

    public Goal updateProgress(
            long id,
            double amount,
            long userId) {

        Goal goal = goalRepository.findById(id).orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (goal.getTargetAmount() == 0) {
            throw new RuntimeException("Invalid target amount");
        }

        goal.setCurrentAmount(amount);

        double ratio = amount / goal.getTargetAmount();

        if (ratio >= 1.0) {
            goal.setStatus(GoalStatus.EXCEEDED);
        } else if (ratio >= 0.8) {
            goal.setStatus(GoalStatus.NEARLIMIT);
        } else {
            goal.setStatus(GoalStatus.ONTRACK);
        }

        return goalRepository.save(goal);
    }


    public void deleteGoal(
            long id,
            long userId) {

        Goal goal = goalRepository.findById(id).orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        goalRepository.delete(goal);
    }
    
    public List<GoalEntity> getGoalsByUserId(long userId) {
    return goalRepository.findByUserId(userId);
}

    public Integer getActiveGoalsCount(long userId) {
        return goalRepository.countByUserIdAndStatus(userId, GoalStatus.ONTRACK);
    }
}
