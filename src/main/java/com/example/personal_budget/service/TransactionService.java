package com.example.personal_budget.service;

import com.example.personal_budget.dto.request.CreateTransactionRequest;
import com.example.personal_budget.dto.request.MonthlyReportRequest;
import com.example.personal_budget.dto.request.TransactionFilterRequest;
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
    @Getter
    private final UserService userService;

    public Transaction getById (Long contextUserId, Long transactionId) {
        Transaction transaction = transactionRepo.findById(transactionId).orElseThrow(
                () -> new TransactionNotFoundException(transactionId));

        verifyUserAccess(contextUserId, transaction.getUser().getId());
        return transaction;
    }

    @Transactional
    public Transaction addTransaction (Long userId, @NonNull CreateTransactionRequest request) {
        verifyUserAccess(userId, request.getUser().getId());

        Transaction transaction = Transaction.builder().user(request.getUser()).amount(request.getAmount()).type(
                request.getType()).date(request.getDate()).category(request.getCategory()).source(
                request.getSource()).description(request.getDescription()).build();

        return transactionRepo.save(transaction);
    }

    public List<Transaction> getAllTransactions (Long contextUserId) {
        return transactionRepo.findByUserId(contextUserId);
    }

    @Transactional
    public Transaction updateTransaction (Long transactionId,
                                          Long contextUserId,
                                          @NonNull CreateTransactionRequest request) {
        Transaction transaction = transactionRepo.findById(transactionId).orElseThrow(
                () -> new EntityNotFoundException("Transaction not found"));

        verifyUserAccess(contextUserId, transaction.getUser().getId());

        transaction.setAmount(request.getAmount());
        transaction.setDate(request.getDate());
        transaction.setDescription(request.getDescription());
        transaction.setSource(request.getSource());
        transaction.setCategory(request.getCategory());
        transaction.setType(request.getType());

        return transactionRepo.save(transaction);
    }

    @Transactional
    public void deleteTransaction (Long transactionId, Long userId) {
        Transaction transaction = transactionRepo.findById(transactionId).orElseThrow(
                () -> new EntityNotFoundException("Transaction not found"));

        verifyUserAccess(userId, transaction.getUser().getId());
        transactionRepo.delete(transaction);
    }

    public List<Transaction> getIncomeTransactions (Long contextUserId) {
        return transactionRepo.findByUserIdAndType(contextUserId, TransactionType.INCOME);
    }

    public List<Transaction> getExpenseTransactions (Long contextUserId) {
        return transactionRepo.findByUserIdAndType(contextUserId, TransactionType.EXPENSE);
    }

    public Double getTotalIncome (Long contextUserId) {
        return transactionRepo.sumByUserIdAndType(contextUserId, TransactionType.INCOME);
    }

    public Double getTotalExpense (Long contextUserId) {
        return transactionRepo.sumByUserIdAndType(contextUserId, TransactionType.EXPENSE);
    }

    public List<Transaction> filterHistory (Long userId, @NonNull TransactionFilterRequest request) {
        verifyUserAccess(userId, request.getUserId());

        return transactionRepo.findByUserIdAndDateBetweenAndCategoryId(request.getUserId(), request.getStartDate(),
                                                                       request.getEndDate(), request.getCategoryId());
    }

    public Map<Month, Double> getMonthlyTotal (Long userId,
                                               @NonNull MonthlyReportRequest request,
                                               TransactionType type) {
        verifyUserAccess(userId, request.getUserId());

        return transactionRepo.getMonthlyTotal(request.getUserId(), type, request.getStartDate(),
                                               request.getEndDate()).stream().collect(
                Collectors.toMap(row -> Month.of((Integer) row[0]), row -> ((Number) row[1]).doubleValue(), (a, b) -> a,
                                 LinkedHashMap::new));
    }

    public Map<String, Double> getCategoryMap (Long contextId, Long requestUserId, TransactionType type) {
        verifyUserAccess(contextId, requestUserId);

        return transactionRepo.getCategoryAmount(requestUserId, type).stream().collect(
                Collectors.toMap(row -> (String) row[0], row -> ((Number) row[1]).doubleValue(), (a, b) -> a,
                                 LinkedHashMap::new));
    }

    public List<Transaction> getTransactionsByDateRange (Long contextUserId, LocalDate startDate, LocalDate end) {
        return transactionRepo.findByUserIdAndDateBetween(contextUserId, startDate, end);
    }

    public List<Transaction> getRecentTransactions (Long contextUserId) {
        return transactionRepo.findTop5ByUserIdOrderByDateDescIdDesc(contextUserId);
    }

    private void verifyUserAccess (Long contextUserId, Long requestUserId) {

        if (!contextUserId.equals(requestUserId)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
    }

}