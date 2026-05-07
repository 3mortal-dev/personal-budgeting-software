package com.example.personal_budget.service;


import java.util.List;
import org.springframework.stereotype.Service;

import com.example.personal_budget.dto.request.GoalRequest;
import com.example.personal_budget.entity.GoalEntity;
import com.example.personal_budget.repository.GoalRepository;
import com.example.personal_budget.enums.GoalStatus;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    public GoalEntity addGoal(GoalRequest request , long userId) {
        GoalEntity goal = new GoalEntity();
        goal.setUserId(userId);
        goal.setGoalName(request.getGoalName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setDeadline(request.getDeadline());
        goal.setCurrentAmount(0.0);
        goal.setStatus(GoalStatus.ONTRACK);
        return goalRepository.save(goal);
    }

    public GoalEntity editGoal(long id, GoalRequest request, long userId) {

        GoalEntity goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (!goal.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        goal.setGoalName(request.getGoalName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setDeadline(request.getDeadline());

        return goalRepository.save(goal);
    }
    public GoalEntity updateProgress(long id, double amount, long userId) {

        GoalEntity goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

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


  public void deleteGoal(long id, long userId) {

        GoalEntity goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

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
