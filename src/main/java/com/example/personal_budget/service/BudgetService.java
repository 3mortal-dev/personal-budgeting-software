package com.example.personal_budget.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.personal_budget.dto.request.CreateBudgetRequest;
import com.example.personal_budget.entity.Budget;
import com.example.personal_budget.entity.Category;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.BudgetStatus;
import com.example.personal_budget.repository.BudgetRepository;
import com.example.personal_budget.repository.CategoryRepository;
import com.example.personal_budget.repository.UserRepository;

import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<Budget> getAllBudgets(Long userID) {
        return budgetRepository.findByUserId(userID);
    }

    public List<Budget> getActiveBudgets(Long userID) {
        return budgetRepository.findByUserIdAndEndDateGreaterThanEqual(userID, LocalDate.now());
    }

    public List<Budget> getNearLimitBudgets(Long userID) {
        return budgetRepository.findByUserIdAndStatus(userID, BudgetStatus.NEAR_LIMIT);
    }

    public List<Budget> getExeededLimitBudgets(Long userID) {
        return budgetRepository.findByUserIdAndStatus(userID, BudgetStatus.EXCEEDED_LIMIT);
    }

    public List<Budget> getExpiredBudgets(Long userID) {
        return budgetRepository.findByUserIdAndEndDateLessThan(userID, LocalDate.now());
    }

    public Long countActiveBudgets(Long userID) {
        return budgetRepository.countByUserIdAndEndDateGreaterThanEqual(userID, LocalDate.now());
    }

    public Long countExpiredBudgets(Long userID) {
        return budgetRepository.countByUserIdAndEndDateLessThan(userID, LocalDate.now());
    }

    public Budget getBudgetById(Long userID, Long budgetID) {
        return budgetRepository.findByIdAndUserId(budgetID, userID)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
    }

    public Budget addBudget(Long userID, CreateBudgetRequest request) {

        User user = userRepository.findById(userID)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Optional<Budget> existingBudget = budgetRepository.findByUserIdAndCategoryId(userID, request.getCategoryId());

        if (existingBudget.isPresent()) {
            Budget existing = existingBudget.get();

            if (existing.getEndDate().isBefore(LocalDate.now())) {
                budgetRepository.delete(existing);
            } else {
                throw new RuntimeException("An active budget already exists for this category. Edit or delete it before adding a new one.");
            }
        }

        Budget budget = Budget.builder()
                .user(user)
                .category(category)
                .spendingLimit(request.getSpendingLimit())
                .threshold(request.getThreshold())
                .startDate(LocalDate.now())
                .endDate(request.getEndDate())
                .status(BudgetStatus.ON_TRACK)
                .build();

        return budgetRepository.save(budget);
    }

    public Budget editBudget(Long userID, Long budgetID, CreateBudgetRequest request) {

        Budget budget = budgetRepository.findByIdAndUserId(budgetID, userID)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        Budget updatedBudget = Budget.builder()
                .id(budget.getId())
                .user(budget.getUser())
                .category(budget.getCategory())
                .spendingLimit(request.getSpendingLimit())
                .spentAmount(budget.getSpentAmount())
                .threshold(request.getThreshold())
                .startDate(budget.getStartDate())
                .endDate(request.getEndDate())
                .status(budget.getStatus())
                .build();

        return budgetRepository.save(updatedBudget);
    }

    public void deleteAllBudgets(Long userID) {
        List<Budget> budgets = budgetRepository.findByUserId(userID);
        budgetRepository.deleteAll(budgets);
    }

    public void deleteExpiredBudgets(Long userID) {
        List<Budget> budgets = budgetRepository.findByUserIdAndEndDateLessThan(userID, LocalDate.now());
        budgetRepository.deleteAll(budgets);
    }

    public void deleteBudgetById(Long userID, Long budgetID) {

        Budget budget = budgetRepository.findByIdAndUserId(budgetID, userID)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        budgetRepository.delete(budget);
    }

    public void onTransactionAdded(Long userID, Long categoryID, Double amount) {

        if (categoryID == null) {
            return;
        }

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndCategoryId(userID, categoryID);
        if (budgetOpt.isEmpty()) {
            return;
        }

        Budget budget = budgetOpt.get();

        if (budget.getEndDate().isBefore(LocalDate.now())) {
            return;
        }

        Double newSpentAmount = budget.getSpentAmount() + amount;
        updateBudgetSpending(budget, newSpentAmount);
    }

    public void onTransactionDeleted(Long userID, Long categoryID, Double amount, LocalDate transactionDate) {

        if (categoryID == null) {
            return;
        }

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndCategoryId(userID, categoryID);
        if (budgetOpt.isEmpty()) {
            return;
        }

        Budget budget = budgetOpt.get();

        if (budget.getEndDate().isBefore(LocalDate.now()) || transactionDate.isBefore(budget.getStartDate())) {
            return;
        }

        Double newSpentAmount = Math.max(0.0, budget.getSpentAmount() - amount);
        updateBudgetSpending(budget, newSpentAmount);
    }

    // ---------------------------------------------------------------------------------------
    public void onTransactionEdited(Long userID,
            Long oldCategoryID, Long newCategoryID,
            Double oldAmount, Double newAmount,
            LocalDate oldTransactionDate, LocalDate newTransactionDate) {

        if (oldCategoryID != null) {
            Optional<Budget> oldBudgetOpt = budgetRepository.findByUserIdAndCategoryId(userID, oldCategoryID);
            if (oldBudgetOpt.isPresent()) {
                Budget oldBudget = oldBudgetOpt.get();
                if (!(oldBudget.getEndDate().isBefore(LocalDate.now()) || oldTransactionDate.isBefore(oldBudget.getStartDate()))) {
                    Double newSpentAmount = Math.max(0.0, oldBudget.getSpentAmount() - oldAmount);
                    updateBudgetSpending(oldBudget, newSpentAmount);
                }
            }
        }

        if (newCategoryID != null) {
            Optional<Budget> newBudgetOpt = budgetRepository.findByUserIdAndCategoryId(userID, newCategoryID);
            if (newBudgetOpt.isPresent()) {
                Budget newBudget = newBudgetOpt.get();
                if (!(newBudget.getEndDate().isBefore(LocalDate.now()) || newTransactionDate.isBefore(newBudget.getStartDate()))) {
                    Double newSpentAmount = newBudget.getSpentAmount() + newAmount;
                    updateBudgetSpending(newBudget, newSpentAmount);
                }
            }
        }
    }
    // ---------------------------------------------------------------------------------------

    private void updateBudgetSpending(Budget budget, Double newSpentAmount) {

        budget.setSpentAmount(newSpentAmount);

        Double limit = budget.getSpendingLimit();
        Double thresholdAmount = limit * (budget.getThreshold() / 100);

        if (newSpentAmount >= limit) {
            budget.setStatus(BudgetStatus.EXCEEDED_LIMIT);
        } else if (newSpentAmount >= thresholdAmount) {
            budget.setStatus(BudgetStatus.NEAR_LIMIT);
        } else {
            budget.setStatus(BudgetStatus.ON_TRACK);
        }

        budgetRepository.save(budget);
    }

    public Collection<Budget> getActiveBudgets(Long userId, int limit) {

        return budgetRepository.findByUserIdAndEndDateAfter(
                userId,
                LocalDate.now(),
                PageRequest.of(0, limit, Sort.by("endDate").ascending())
        );
    }
}
