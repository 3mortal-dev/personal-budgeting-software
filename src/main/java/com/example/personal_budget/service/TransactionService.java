package com.example.personal_budget.service;

import com.example.personal_budget.dto.request.CreateTransactionRequest;
import com.example.personal_budget.dto.request.MonthlyReportRequest;
import com.example.personal_budget.dto.request.TransactionFilterRequest;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import com.example.personal_budget.exception.TransactionNotFoundException;
import com.example.personal_budget.repository.TransactionRepository;
import jakarta.persistence.EntityNotFoundException;
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
    private final UserService userService;

    public Transaction getById(Long userId, Long transactionId) {

        Transaction t = transactionRepo.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId));
        verifyUserAccess(userId, t.getUser().getId());
        return t;
    }

    @Transactional
    public Transaction addTransaction(Long userId, @NonNull CreateTransactionRequest request) {

        verifyUserAccess(request.getUserId(), userId);

        Transaction transaction = Transaction.builder()
                .user(userService.getUser())
                .amount(request.getAmount())
                .type(request.getType())
                .date(request.getDate())
                .categoryId(request.getCategoryId())
                .source(request.getSource())
                .description(request.getDescription())
                .build();

        return transactionRepo.save(transaction);
    }

    public List<Transaction> getAllTransactions(Long userId) {

        List<Transaction> list = transactionRepo.findByUserId(userId);
        if (!list.isEmpty())
            verifyUserAccess(userId, list.getFirst().getUser().getId());

        return list;
    }

    @Transactional
    public Transaction updateTransaction(Long transactionId, Long userId, CreateTransactionRequest request) throws AccessDeniedException {

        Transaction transaction = transactionRepo.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You are not allowed to update this transaction");
        }

        transaction.setAmount(request.getAmount());
        transaction.setDate(request.getDate());
        transaction.setDescription(request.getDescription());
        transaction.setSource(request.getSource());
        transaction.setCategory(request.getCategory());
        transaction.setType(request.getType());

        return transactionRepo.save(transaction);
    }

    @Transactional
    public void deleteTransaction(Long transactionId, Long userId) throws AccessDeniedException {

        Transaction transaction = transactionRepo.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found"));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You are not allowed to delete this transaction");
        }

        transactionRepo.delete(transaction);
    }

    public List<Transaction> getIncomeTransactions(Long userId) {
        return transactionRepo.findByUserIdAndType(userId, TransactionType.INCOME);
    }

    public List<Transaction> getExpenseTransactions(Long userId) {
        return transactionRepo.findByUserIdAndType(userId, TransactionType.EXPENSE);
    }

    public Double getTotalIncome(Long userId) {
        return transactionRepo.sumByUserIdAndType(userId, TransactionType.INCOME);
    }

    public Double getTotalExpense(Long userId) {
        return transactionRepo.sumByUserIdAndType(userId, TransactionType.EXPENSE);
    }

    public List<Transaction> filterHistory(Long userId, @NonNull TransactionFilterRequest request) {

        verifyUserAccess(userId, request.getUserId());

        return transactionRepo.findByUserIdAndDateBetweenAndCategoryId(
                request.getUserId(),
                request.getStartDate(),
                request.getEndDate(),
                request.getCategoryId()
        );
    }

    // For Reports
    public Map<Month, Double> getMonthlyTotal(Long userId, @NonNull MonthlyReportRequest request, TransactionType type) {

        verifyUserAccess(userId, request.getUserId());

        return transactionRepo.getMonthlyTotal(request.getUserId(), type, request.getStartDate(), request.getEndDate())
                .stream()
                .collect(Collectors.toMap(
                        row -> Month.of((Integer) row[0]),
                        row -> ((Number) row[1]).doubleValue(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    // For Reports
    public Map<String, Double> getCategoryMap(Long userId, TransactionType type) {
        return transactionRepo.getCategoryAmount(userId, type)
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).doubleValue(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    // For Reports
    public Map<String, Double> getCategoryMap(Long userId) {
        return getCategoryMap(userId, TransactionType.EXPENSE);
    }

    // For Reports
    public List<Transaction> getTransactionsByDateRange(Long userId, LocalDate startDate, LocalDate end) {
        return transactionRepo.findByUserIdAndDateBetween(userId, startDate, end);
    }

    // For Dashboard
    public List<Transaction> getRecentTransactions(Long userId) {
        return transactionRepo.findTop5ByUserIdOrderByDateDescIdDesc(userId);
    }

    private void verifyUserAccess(@NonNull Long contextUserId, Long requestUserId) {
        if (!contextUserId.equals(requestUserId)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
    }
}

