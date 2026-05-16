package com.example.personal_budget.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.example.personal_budget.dto.request.BudgetExceededLimitEvent;
import com.example.personal_budget.dto.request.BudgetNearLimitEvent;
import com.example.personal_budget.dto.request.CreateBudgetRequest;
import com.example.personal_budget.dto.request.NotificationEvent;
import com.example.personal_budget.entity.Budget;
import com.example.personal_budget.entity.Category;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.BudgetStatus;
import com.example.personal_budget.repository.BudgetRepository;
import com.example.personal_budget.repository.CategoryRepository;
import com.example.personal_budget.repository.TransactionRepository;
import com.example.personal_budget.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TransactionRepository transactionRepository;

    /**
     * Retrieves every budget owned by a user.
     *
     * @param userID the owner user id
     * @return all budgets for the user
     */
    public List<Budget> getAllBudgets(Long userID) {
        return budgetRepository.findByUserId(userID);
    }

    /**
     * Retrieves budgets whose end date has not passed.
     *
     * @param userID the owner user id
     * @return active budgets for the user
     */
    public List<Budget> getActiveBudgets(Long userID) {
        return budgetRepository.findByUserIdAndEndDateGreaterThanEqual(userID, LocalDate.now());
    }

    /**
     * Retrieves budgets currently marked as near their spending limit.
     *
     * @param userID the owner user id
     * @return near-limit budgets
     */
    public List<Budget> getNearLimitBudgets(Long userID) {
        return budgetRepository.findByUserIdAndStatus(userID, BudgetStatus.NEAR_LIMIT);
    }

    /**
     * Retrieves budgets currently marked as over their spending limit.
     *
     * @param userID the owner user id
     * @return exceeded-limit budgets
     */
    public List<Budget> getExeededLimitBudgets(Long userID) {
        return budgetRepository.findByUserIdAndStatus(userID, BudgetStatus.EXCEEDED_LIMIT);
    }

    /**
     * Retrieves budgets whose end date has passed.
     *
     * @param userID the owner user id
     * @return expired budgets
     */
    public List<Budget> getExpiredBudgets(Long userID) {
        return budgetRepository.findByUserIdAndEndDateLessThan(userID, LocalDate.now());
    }

    /**
     * Counts active budgets for a user.
     *
     * @param userID the owner user id
     * @return the number of active budgets
     */
    public Long countActiveBudgets(Long userID) {
        return budgetRepository.countByUserIdAndEndDateGreaterThanEqual(userID, LocalDate.now());
    }

    /**
     * Counts expired budgets for a user.
     *
     * @param userID the owner user id
     * @return the number of expired budgets
     */
    public Long countExpiredBudgets(Long userID) {
        return budgetRepository.countByUserIdAndEndDateLessThan(userID, LocalDate.now());
    }

    /**
     * Loads a budget by id while enforcing user ownership.
     *
     * @param userID the owner user id
     * @param budgetID the budget id
     * @return the matching budget
     */
    public Budget getBudgetById(Long userID, Long budgetID) {
        return budgetRepository.findByIdAndUserId(budgetID, userID)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
    }

    /**
     * Creates a budget for a category and initializes its spent amount from
     * existing expenses in the requested date range.
     *
     * @param userID the owner user id
     * @param request the budget creation details
     * @return the saved budget
     */
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

        Double totalSpent = transactionRepository.sumExpenseByUserIdAndCategoryIdAndDateBetween(
                userID,
                request.getCategoryId(),
                request.getStartDate(),
                request.getEndDate()
        );

        Budget budget = Budget.builder()
                .user(user)
                .category(category)
                .spentAmount(0.0)
                .spendingLimit(request.getSpendingLimit())
                .threshold(request.getThreshold())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(BudgetStatus.ON_TRACK)
                .build();

        return updateBudgetSpending(budget, totalSpent);
    }

    /**
     * Replaces an existing user budget with new budget details.
     *
     * @param userID the owner user id
     * @param budgetID the budget to edit
     * @param request the replacement budget details
     * @return the saved replacement budget
     */
    public Budget editBudget(Long userID, Long budgetID, CreateBudgetRequest request) {

        Budget budget = budgetRepository.findByIdAndUserId(budgetID, userID)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        budgetRepository.delete(budget);

        return addBudget(userID, request);
    }

    /**
     * Deletes every budget owned by a user.
     *
     * @param userID the owner user id
     */
    public void deleteAllBudgets(Long userID) {
        List<Budget> budgets = budgetRepository.findByUserId(userID);
        budgetRepository.deleteAll(budgets);
    }

    /**
     * Deletes expired budgets owned by a user.
     *
     * @param userID the owner user id
     */
    public void deleteExpiredBudgets(Long userID) {
        List<Budget> budgets = budgetRepository.findByUserIdAndEndDateLessThan(userID, LocalDate.now());
        budgetRepository.deleteAll(budgets);
    }

    /**
     * Deletes a single budget after verifying user ownership.
     *
     * @param userID the owner user id
     * @param budgetID the budget to delete
     */
    public void deleteBudgetById(Long userID, Long budgetID) {

        Budget budget = budgetRepository.findByIdAndUserId(budgetID, userID)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        budgetRepository.delete(budget);
    }

    /**
     * Applies a new expense amount to the matching active budget, when one exists.
     *
     * @param userID the owner user id
     * @param categoryID the transaction category id
     * @param amount the expense amount to add
     * @param transactionDate the transaction date used to check the budget range
     */
    public void onTransactionAdded(Long userID, Long categoryID, Double amount, LocalDate transactionDate) {

        if (categoryID == null) {
            return;
        }

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndCategoryId(userID, categoryID);
        if (budgetOpt.isEmpty()) {
            return;
        }

        Budget budget = budgetOpt.get();

        if (budget.getEndDate().isBefore(LocalDate.now())
                || transactionDate.isBefore(budget.getStartDate())
                || transactionDate.isAfter(budget.getEndDate())) {
            return;
        }

        Double newSpentAmount = budget.getSpentAmount() + amount;
        updateBudgetSpending(budget, newSpentAmount);
    }

    /**
     * Reverses an expense amount from the matching active budget, when one exists.
     *
     * @param userID the owner user id
     * @param categoryID the transaction category id
     * @param amount the expense amount to subtract
     * @param transactionDate the transaction date used to check the budget range
     */
    public void onTransactionDeleted(Long userID, Long categoryID, Double amount, LocalDate transactionDate) {

        if (categoryID == null) {
            return;
        }

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndCategoryId(userID, categoryID);
        if (budgetOpt.isEmpty()) {
            return;
        }

        Budget budget = budgetOpt.get();

        if (budget.getEndDate().isBefore(LocalDate.now())
                || transactionDate.isBefore(budget.getStartDate())
                || transactionDate.isAfter(budget.getEndDate())) {
            return;
        }

        Double newSpentAmount = Math.max(0.0, budget.getSpentAmount() - amount);
        updateBudgetSpending(budget, newSpentAmount);
    }

    private Budget updateBudgetSpending(Budget budget, Double newSpentAmount) {

        budget.setSpentAmount(newSpentAmount);

        Double limit = budget.getSpendingLimit();
        Double thresholdAmount = limit * (budget.getThreshold() / 100);

        if (newSpentAmount >= limit) {

            budget.setStatus(BudgetStatus.EXCEEDED_LIMIT);
            NotificationEvent event = new BudgetExceededLimitEvent(
                    budget.getUser().getId(),
                    budget.getCategory().getName(),
                    BigDecimal.valueOf(newSpentAmount - limit)
            );
            notificationService.createNotification(event);

        } else if (newSpentAmount >= thresholdAmount) {

            budget.setStatus(BudgetStatus.NEAR_LIMIT);
            NotificationEvent event = new BudgetNearLimitEvent(
                    budget.getUser().getId(),
                    budget.getCategory().getName(),
                    BigDecimal.valueOf(newSpentAmount - limit)
            );
            notificationService.createNotification(event);

        } else {
            budget.setStatus(BudgetStatus.ON_TRACK);
        }

        return budgetRepository.save(budget);
    }

    /**
     * Retrieves a limited page of active budgets ordered by soonest end date.
     *
     * @param userId the owner user id
     * @param limit the maximum number of budgets to return
     * @return active budgets for dashboard display
     */
    public List<Budget> getActiveBudgets(Long userId, int limit) {

        return budgetRepository.findByUserIdAndEndDateGreaterThanEqual(
                userId,
                LocalDate.now(),
                PageRequest.of(0, limit, Sort.by("endDate").ascending())
        );
    }
}
