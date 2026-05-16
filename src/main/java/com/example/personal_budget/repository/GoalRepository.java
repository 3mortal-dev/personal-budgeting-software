package com.example.personal_budget.repository;

import com.example.personal_budget.entity.Goal;
import com.example.personal_budget.enums.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;


@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {
    /**
     * Finds goals owned by a user.
     *
     * @param userId the owner user id
     * @return goals for the user
     */
    List<Goal> findByUserId(long userId);

    /**
     * Counts goals for a user with the supplied status.
     *
     * @param userId the owner user id
     * @param ontrack the status to count
     * @return the number of matching goals
     */
    Integer countByUserIdAndStatus(
            Long userId,
            GoalStatus ontrack);

    /**
     * Finds goals with the supplied deadline.
     *
     * @param reminderDate the deadline date
     * @return goals due on the date
     */
    List<Goal> findByDeadline(LocalDate reminderDate);

    /**
     * Counts goals for a user with the supplied status.
     *
     * @param userId the owner user id
     * @param status the status to count
     * @return the number of matching goals
     */
    Integer countByUserIdAndStatus(long userId, GoalStatus status);

    /**
     * Counts goals for a user whose status is in the supplied list.
     *
     * @param userId the owner user id
     * @param statuses the statuses to include
     * @return the number of matching goals
     */
    Integer countByUserIdAndStatusIn(long userId, List<GoalStatus> statuses);
}   
