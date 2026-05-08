package com.example.personal_budget.service;

import com.example.personal_budget.dto.request.GoalReminderEvent;
import com.example.personal_budget.entity.Goal;
import com.example.personal_budget.repository.GoalRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GoalReminderScheduler {

    private final GoalRepository goalRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *")
    public void sendGoalReminders() {

        LocalDate reminderDate = LocalDate.now().plusDays(3);

        List<Goal> goals = goalRepository
                .findByDeadline(reminderDate);

        for (Goal goal : goals) {

            GoalReminderEvent event =
                    new GoalReminderEvent(
                            goal.getUser().getId(),
                            goal.getGoalName(),
                            goal.getDeadline()
                    );

            notificationService.createNotification(event);
        }
    }
}