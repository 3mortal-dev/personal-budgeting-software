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

    List<Budget> findByUserId(Long userID);

    List<Budget> findByUserIdAndEndDateGreaterThanEqual(Long userId, LocalDate date);

    List<Budget> findByUserIdAndEndDateGreaterThanEqual(Long userId, LocalDate date, Pageable pageable);

    List<Budget> findByUserIdAndEndDateGreaterThanEqualOrderByStartDateDescIdDesc(Long userId, LocalDate date, Pageable pageable);

    List<Budget> findByUserIdAndStatus(Long userID, BudgetStatus status);

    List<Budget> findByUserIdAndEndDateLessThan(Long userID, LocalDate date);

    List<Budget> findByUserIdOrderByStartDateDescIdDesc(Long userID, Pageable pageable);

    List<Budget> findByUserIdAndEndDateAfter(Long userId, LocalDate date, Pageable pageable);

    Optional<Budget> findByUserIdAndCategoryId(Long userID, Long categoryId);

    Optional<Budget> findByIdAndUserId(Long id, Long userID);

    Long countByUserIdAndEndDateGreaterThanEqual(Long userId, LocalDate date);

    Long countByUserIdAndEndDateLessThan(Long userId, LocalDate date);

}
