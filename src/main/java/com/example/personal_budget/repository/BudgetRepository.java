package com.example.personal_budget.repository;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDate;
import java.util.Optional;

import com.example.personal_budget.entity.Budget;
import com.example.personal_budget.enums.BudgetStatus;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserId(Long userID);

    List<Budget> findByUserIdAndEndDateGreaterThanEqual(Long userId, LocalDate date);

    List<Budget> findByUserIdAndStatus(Long userID, BudgetStatus status);

    List<Budget> findByUserIdAndEndDateLessThan(Long userID, LocalDate date);

    Optional<Budget> findByUserIdAndCategoryId(Long userID, Long categoryId);

    Optional<Budget> findByIdAndUserId(Long id, Long userID);

    Long countByUserIdAndEndDateGreaterThanEqual(Long userId, LocalDate date);

    Long countByUserIdAndEndDateLessThan(Long userId, LocalDate date);
}
