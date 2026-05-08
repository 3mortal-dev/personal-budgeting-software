package com.example.personal_budget.repository;

import com.example.personal_budget.entity.Goal;
import com.example.personal_budget.enums.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;


@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {
List<Goal> findByUserId(long userId);

    Integer countByUserIdAndStatus(
            Long userId,
            GoalStatus ontrack);

    List<Goal> findByDeadline(LocalDate reminderDate);
    Integer countByUserIdAndStatus(long userId, GoalStatus status);

    // ADD THIS:
    Integer countByUserIdAndStatusIn(long userId, List<GoalStatus> statuses);
}   