package com.example.personal_budget.service;

import com.example.personal_budget.dto.request.CreateTransactionRequest;
import com.example.personal_budget.dto.request.MonthlyReportRequest;
import com.example.personal_budget.dto.request.TransactionFilterRequest;
import com.example.personal_budget.entity.Category;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import com.example.personal_budget.exception.TransactionNotFoundException;
import com.example.personal_budget.repository.TransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Month;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepo;
    private final CategoryService categoryService;
    private final BudgetService budgetService;

    @Getter
    private final UserService userService;

    /**
     * Loads a transaction by id.
     *
     * @param transactionId the transaction id
     * @return the matching transaction
     */
    public Transaction getById(Long transactionId) {

        return transactionRepo.findById(transactionId).orElseThrow(
                () -> new TransactionNotFoundException(transactionId));
    }

    /**
     * Creates a transaction for a user and updates the related budget when the
     * transaction is an expense.
     *
     * @param userId the owner of the new transaction
     * @param request the transaction details
     * @return the saved transaction
     */
    @Transactional
    public Transaction addTransaction(
            Long userId,
            @NonNull CreateTransactionRequest request) {

        // For INCOME transactions, category should be null; for EXPENSE, source should be null
        Category category = null;
        if (request.getType().equals(TransactionType.EXPENSE)) {

            if (request.getCategoryId() == null) {
                throw new IllegalArgumentException("Category is required for EXPENSE transactions");
            }

            category = categoryService.getCategoryById(userId, request.getCategoryId());
            budgetService.onTransactionAdded(userId, request.getCategoryId(), request.getAmount(), request.getDate());
        }

        Transaction transaction = Transaction.builder().user(userService.getUserById(userId)).amount(
                request.getAmount()).type(request.getType()).date(request.getDate()).category(category).source(
                request.getSource()).description(request.getDescription()).build();

        return transactionRepo.save(transaction);
    }

    /**
     * Retrieves all transactions owned by a user.
     *
     * @param contextUserId the user id used as the data access context
     * @return the user's transactions
     */
    public List<Transaction> getAllTransactions(Long contextUserId) {
        return transactionRepo.findByUserId(contextUserId);
    }

    /**
     * Updates a transaction after verifying that it belongs to the user.
     *
     * @param transactionId the transaction to update
     * @param userId the authenticated user's id
     * @param request the replacement transaction details
     * @return the updated transaction
     */
    @Transactional
    public Transaction updateTransaction(
            Long transactionId,
            Long userId,
            @NonNull CreateTransactionRequest request) {
        Transaction transaction = transactionRepo.findById(transactionId).orElseThrow(
                () -> new EntityNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You are not allowed to update this transaction");
        }

        // For INCOME transactions, category should be null; for EXPENSE, use category
        Category category = null;

        if (request.getType().equals(TransactionType.EXPENSE) && request.getCategoryId() != null) {
            category = categoryService.getCategoryById(userId, request.getCategoryId());
        }

        budgetService.onTransactionDeleted(userId, transaction.getCategory().getId(), transaction.getAmount(), transaction.getDate());
        budgetService.onTransactionAdded(userId, request.getCategoryId(), request.getAmount(), request.getDate());

        transaction.setAmount(request.getAmount());
        transaction.setDate(request.getDate());
        transaction.setDescription(request.getDescription());
        transaction.setSource(request.getSource());
        transaction.setCategory(category);
        transaction.setType(request.getType());

        return transactionRepo.save(transaction);
    }

    /**
     * Deletes a transaction after verifying ownership and reverses any related
     * budget spending impact.
     *
     * @param transactionId the transaction to delete
     * @param userId the authenticated user's id
     */
    @Transactional
    public void deleteTransaction(
            Long transactionId,
            Long userId) {
        Transaction transaction = transactionRepo.findById(transactionId).orElseThrow(
                () -> new EntityNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You are not allowed to update this transaction");
        }

        if (transaction.getType().equals(TransactionType.EXPENSE) && transaction.getCategory() != null) {
            budgetService.onTransactionDeleted(userId, transaction.getCategory().getId(), transaction.getAmount(),
                    transaction.getDate());
        }

        transactionRepo.delete(transaction);
    }

    /**
     * Retrieves income transactions for a user.
     *
     * @param contextUserId the user id used as the data access context
     * @return income transactions for the user
     */
    public List<Transaction> getIncomeTransactions(Long contextUserId) {
        return transactionRepo.findByUserIdAndType(contextUserId, TransactionType.INCOME);
    }

    /**
     * Retrieves expense transactions for a user.
     *
     * @param contextUserId the user id used as the data access context
     * @return expense transactions for the user
     */
    public List<Transaction> getExpenseTransactions(Long contextUserId) {
        return transactionRepo.findByUserIdAndType(contextUserId, TransactionType.EXPENSE);
    }

    /**
     * Calculates all-time income for a user.
     *
     * @param contextUserId the user id used as the data access context
     * @return the user's total income, or zero when no income exists
     */
    public Double getTotalIncome(Long contextUserId) {
        return transactionRepo.sumByUserIdAndType(contextUserId, TransactionType.INCOME);
    }

    /**
     * Calculates all-time expenses for a user.
     *
     * @param contextUserId the user id used as the data access context
     * @return the user's total expenses, or zero when no expenses exist
     */
    public Double getTotalExpense(Long contextUserId) {
        return transactionRepo.sumByUserIdAndType(contextUserId, TransactionType.EXPENSE);
    }

    /**
     * Calculates income within a date range for a user.
     *
     * @param contextUserId the user id used as the data access context
     * @param startDate the first date included in the calculation
     * @param endDate the last date included in the calculation
     * @return total income in the range, or zero when no income exists
     */
    public Double getMonthlyIncome(
            Long contextUserId,
            LocalDate startDate,
            LocalDate endDate) {
        return transactionRepo.sumByUserIdAndTypeAndDateBetween(contextUserId, TransactionType.INCOME, startDate,
                endDate);
    }

    /**
     * Calculates expenses within a date range for a user.
     *
     * @param contextUserId the user id used as the data access context
     * @param startDate the first date included in the calculation
     * @param endDate the last date included in the calculation
     * @return total expenses in the range, or zero when no expenses exist
     */
    public Double getMonthlyExpense(
            Long contextUserId,
            LocalDate startDate,
            LocalDate endDate) {
        return transactionRepo.sumByUserIdAndTypeAndDateBetween(contextUserId, TransactionType.EXPENSE, startDate,
                endDate);
    }

    /**
     * Counts transactions owned by a user.
     *
     * @param contextUserId the user id used as the data access context
     * @return the number of stored transactions
     */
    public Integer getNumberOfTransactions(Long contextUserId) {
        return transactionRepo.countByUserId(contextUserId);
    }

    /**
     * Filters a user's transactions by the date and category fields supplied in
     * the request.
     *
     * @param userId the user whose history should be filtered
     * @param request the filtering criteria
     * @return transactions matching the filter
     */
    public List<Transaction> filterHistory(
            Long userId,
            @NonNull TransactionFilterRequest request) {

        return transactionRepo.findByUserIdAndDateBetweenAndCategoryId(userId, request.getStartDate(),
                request.getEndDate(), request.getCategoryId());
    }

    /**
     * Builds a month-to-total map for report charts.
     *
     * @param userId the user whose transactions are included
     * @param request the report date range
     * @param type the transaction type to aggregate
     * @return ordered monthly totals keyed by month
     */
    public Map<Month, Double> getMonthlyTotal(
            Long userId,
            @NonNull MonthlyReportRequest request,
            TransactionType type) {

        return transactionRepo.getMonthlyTotal(userId, type.name(), request.getStartDate(),
                request.getEndDate()).stream().collect(
                Collectors.toMap(row -> Month.of(((Number) row[0]).intValue()), row -> ((Number) row[1]).doubleValue(),
                        (a, b) -> a, LinkedHashMap::new));
    }

    /**
     * Builds a category-to-total map for a user's transactions of the given type.
     *
     * @param contextId the user id used as the data access context
     * @param type the transaction type to aggregate
     * @return totals grouped by category name
     */
    public Map<String, Double> getCategoryMap(
            Long contextId,
            TransactionType type) {

        return transactionRepo.getCategoryAmount(contextId, type).stream().collect(
                Collectors.toMap(row -> (String) row[0], row -> ((Number) row[1]).doubleValue(), (a, b) -> a,
                        LinkedHashMap::new));
    }

    /**
     * Retrieves transactions in an inclusive date range.
     *
     * @param contextUserId the user id used as the data access context
     * @param startDate the first date included in the result
     * @param end the last date included in the result
     * @return transactions in the requested range
     */
    public List<Transaction> getTransactionsByDateRange(
            Long contextUserId,
            LocalDate startDate,
            LocalDate end) {
        return transactionRepo.findByUserIdAndDateBetween(contextUserId, startDate, end);
    }

    /**
     * Retrieves the five most recent transactions for a user.
     *
     * @param contextUserId the user id used as the data access context
     * @return recent transactions ordered newest first
     */
    public List<Transaction> getRecentTransactions(Long contextUserId) {
        return transactionRepo.findTop5ByUserIdOrderByDateDescIdDesc(contextUserId);
    }
}
