package com.example.personal_budget.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.example.personal_budget.entity.GoalEntity;
import com.example.personal_budget.repository.GoalRepository;
import com.example.personal_budget.enums.GoalStatus;
import lombok.RequiredArgsConstructor;
import com.example.personal_budget.service.UserService;

@Service
@RequiredArgsConstructor
public class GoalService {

    @Autowired
    private GoalRepository goalRepository;

    public GoalEntity addGoal(GoalEntity goal , long userId) {
        goal.setUserId(userId);
        goal.setStatus(GoalStatus.ONTRACK);
        return goalRepository.save(goal);
    }

    public GoalEntity editGoal(long id, GoalEntity updatedGoal) {
        GoalEntity goal = goalRepository.findById(id).orElseThrow(() -> new RuntimeException("Goal not found"));
        goal.setGoalName(updatedGoal.getGoalName());
        goal.setTargetAmount(updatedGoal.getTargetAmount());    
        goal.setDeadline(updatedGoal.getDeadline());
        return goalRepository.save(goal);
    }
    public GoalEntity updateProgress(long id , double amount)
    {
        GoalEntity goal = goalRepository.findById(id).orElseThrow( () -> new RuntimeException("Goal not found"));
        double r = amount / goal.getTargetAmount();
        if(r >= 1.0)
        {
            goal.setStatus(GoalStatus.EXCEEDED);
        }
        else if(r >= 0.8)
        {
            goal.setStatus(GoalStatus.NEARLIMIT);
        }
        else
        {
            goal.setStatus(GoalStatus.ONTRACK);
        }
        return goalRepository.save(goal);
    }
    
    public void deleteGoal(long id)
    {
        goalRepository.deleteById(id);
    }

}
