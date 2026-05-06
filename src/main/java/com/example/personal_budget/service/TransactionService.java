package com.example.personal_budget.service;

import com.example.personal_budget.dto.CreateTransactionRequest;
import com.example.personal_budget.dto.TransactionFilterRequest;
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

    public Transaction getById(Long id) {
        return transactionRepo.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException(id));
    }

    @Transactional
    public Transaction addTransaction(@NonNull CreateTransactionRequest req) {

        Transaction transaction = Transaction.builder()
                .userID(req.getUserID())
                .amount(req.getAmount())
                .type(req.getType())
                .date(req.getDate())
                .categoryID(req.getCategoryID())
                .source(req.getSource())
                .description(req.getDescription())
                .build();

        return transactionRepo.save(transaction);
    }

    public List<Transaction> getAllTransactions(Long userID) {
        return transactionRepo.findByUserID(userID);
    }

    @Transactional
    public Transaction updateTransaction(Long transactionID, Long userID, CreateTransactionRequest req) throws AccessDeniedException {

        Transaction transaction = transactionRepo.findById(transactionID)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found"));

        if (transaction.getUserID() != userID) {
            throw new AccessDeniedException("You are not allowed to update this transaction");
        }

        transaction.setAmount(req.getAmount());
        transaction.setDate(req.getDate());
        transaction.setDescription(req.getDescription());
        transaction.setSource(req.getSource());
        transaction.setCategoryID(req.getCategoryID());
        transaction.setType(req.getType());

        return transactionRepo.save(transaction);
    }

    @Transactional
    public void deleteTransaction(Long transactionID, Long userID) throws AccessDeniedException {

        Transaction transaction = transactionRepo.findById(transactionID)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found"));

        if (transaction.getUserID() != userID) {
            throw new AccessDeniedException("You are not allowed to delete this transaction");
        }

        transactionRepo.delete(transaction);
    }

    public List<Transaction> getIncomeTransactions(Long userID) {
        return transactionRepo.findByUserIDAndType(userID, TransactionType.INCOME);
    }

    public List<Transaction> getExpenseTransactions(Long userID) {
        return transactionRepo.findByUserIDAndType(userID, TransactionType.EXPENSE);
    }

    public Double getTotalIncome(Long userID) {
        return transactionRepo.sumByUserIDAndType(userID, TransactionType.INCOME);
    }

    public Double getTotalExpense(Long userID) {
        return transactionRepo.sumByUserIDAndType(userID, TransactionType.EXPENSE);
    }

    public List<Transaction> filterHistory(@NonNull TransactionFilterRequest req) {
        return transactionRepo.findByUserIDAndDateBetweenAndCategoryID(
                req.getUserID(),
                req.getStartDate(),
                req.getEndDate(),
                req.getCategoryID()
        );
    }

    // For Reports
    public Map<Month, Double> getMonthlyTotal(@NonNull MonthlyReportRequest request, TransactionType type) {
        return transactionRepo.getMonthlyTotal(request.getUserID(), type, request.getStartDate(), request.getEndDate())
                .stream()
                .collect(Collectors.toMap(
                        row -> Month.of((Integer) row[0]),
                        row -> ((Number) row[1]).doubleValue(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    // For Reports
    public Map<String, Double> getCategoryMap(Long userID, TransactionType type) {
        return transactionRepo.getCategoryAmount(userID, type)
                .stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> ((Number) row[1]).doubleValue(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    // For Reports
    public Map<String, Double> getCategoryMap(Long userID) {
        return getCategoryMap(userID, TransactionType.EXPENSE);
    }

    // For Reports
    public List<Transaction> getTransactionsByDateRange(Long userID, LocalDate startDate, LocalDate end) {
        return transactionRepo.findByUserIDAndDateBetween(userID, startDate, end);
    }

    // For Dashboard
    public List<Transaction> getRecentTransactions(Long userID) {
        return transactionRepo.findTop5ByUserIDOrderByDateDescTransactionIDDesc(userID);
    }
}

