package com.example.personal_budget.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.personal_budget.entity.Budget;
import com.example.personal_budget.enums.BudgetStatus;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    /**
     * Finds all budgets owned by a user.
     *
     * @param userID the owner user id
     * @return budgets for the user
     */
    List<Budget> findByUserId(Long userID);

    /**
     * Finds budgets whose end date is on or after the supplied date.
     *
     * @param userId the owner user id
     * @param date the minimum end date
     * @return active budgets
     */
    List<Budget> findByUserIdAndEndDateGreaterThanEqual(Long userId, LocalDate date);

    /**
     * Finds a page of budgets whose end date is on or after the supplied date.
     *
     * @param userId the owner user id
     * @param date the minimum end date
     * @param pageable page and sort information
     * @return active budgets in the requested page
     */
    List<Budget> findByUserIdAndEndDateGreaterThanEqual(Long userId, LocalDate date, Pageable pageable);

    /**
     * Finds a page of active budgets ordered by start date and id descending.
     *
     * @param userId the owner user id
     * @param date the minimum end date
     * @param pageable page information
     * @return active budgets in descending start order
     */
    List<Budget> findByUserIdAndEndDateGreaterThanEqualOrderByStartDateDescIdDesc(Long userId, LocalDate date, Pageable pageable);

    /**
     * Finds budgets for a user by status.
     *
     * @param userID the owner user id
     * @param status the budget status
     * @return matching budgets
     */
    List<Budget> findByUserIdAndStatus(Long userID, BudgetStatus status);

    /**
     * Finds budgets whose end date is before the supplied date.
     *
     * @param userID the owner user id
     * @param date the exclusive upper-bound end date
     * @return expired budgets
     */
    List<Budget> findByUserIdAndEndDateLessThan(Long userID, LocalDate date);

    /**
     * Finds a page of budgets ordered by start date and id descending.
     *
     * @param userID the owner user id
     * @param pageable page information
     * @return budgets in descending start order
     */
    List<Budget> findByUserIdOrderByStartDateDescIdDesc(Long userID, Pageable pageable);

    /**
     * Finds a page of budgets ending after the supplied date.
     *
     * @param userId the owner user id
     * @param date the exclusive lower-bound end date
     * @param pageable page and sort information
     * @return matching budgets
     */
    List<Budget> findByUserIdAndEndDateAfter(Long userId, LocalDate date, Pageable pageable);

    /**
     * Finds a user's budget for a category.
     *
     * @param userID the owner user id
     * @param categoryId the category id
     * @return the matching budget when present
     */
    Optional<Budget> findByUserIdAndCategoryId(Long userID, Long categoryId);

    /**
     * Finds a budget by id while enforcing user ownership.
     *
     * @param id the budget id
     * @param userID the owner user id
     * @return the matching budget when present
     */
    Optional<Budget> findByIdAndUserId(Long id, Long userID);

    /**
     * Counts budgets whose end date is on or after the supplied date.
     *
     * @param userId the owner user id
     * @param date the minimum end date
     * @return the number of active budgets
     */
    Long countByUserIdAndEndDateGreaterThanEqual(Long userId, LocalDate date);

    /**
     * Counts budgets whose end date is before the supplied date.
     *
     * @param userId the owner user id
     * @param date the exclusive upper-bound end date
     * @return the number of expired budgets
     */
    Long countByUserIdAndEndDateLessThan(Long userId, LocalDate date);

}
