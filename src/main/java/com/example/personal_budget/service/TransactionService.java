package com.example.personal_budget.service;

import com.example.personal_budget.dto.CreateTransactionRequest;
import com.example.personal_budget.dto.TransactionFilterRequest;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import com.example.personal_budget.exception.TransactionNotFoundException;
import com.example.personal_budget.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
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
    private final BudgetService budgetService;

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

        budgetService.applyExpenseToBudget(req.getUserID(), req.getCategoryID(), req.getAmount());


        return transactionRepo.save(transaction);
    }

    public List<Transaction> getAllTransactions(Long userID) {
        return transactionRepo.findByUserID(userID);
    }

    public Transaction updateTransaction(Long id, @NonNull CreateTransactionRequest req) {
        Transaction t = getById(id);
        t.setAmount(req.getAmount());
        t.setType(req.getType());
        t.setDate(req.getDate());
        t.setCategoryID(req.getCategoryID());
        t.setSource(req.getSource());
        t.setDescription(req.getDescription());
        return transactionRepo.save(t);
    }

    public void deleteTransaction(Long id) {
        getById(id);
        transactionRepo.deleteById(id);
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

    public Map<String, Double> getCategoryMap(Long userID) {
        return getCategoryMap(userID, TransactionType.EXPENSE);
    }

    public List<Transaction> getTransactionsByDateRange(Long userID, LocalDate startDate, LocalDate end) {
        return transactionRepo.findByUserIDAndDateBetween(userID, startDate, end);
    }

    public List<Transaction> getRecentTransactions(Long userID) {
        return transactionRepo.findTop5ByUserIDOrderByDateDescTransactionIDDesc(userID);
    }
}

