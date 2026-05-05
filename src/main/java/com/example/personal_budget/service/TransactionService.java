package com.example.personal_budget.service;

import com.example.personal_budget.dto.CreateTransactionRequest;
import com.example.personal_budget.dto.TransactionFilterRequest;
import com.example.personal_budget.entity.budget;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import com.example.personal_budget.repository.TransactionRepository;
import com.example.personal_budget.exception.TransactionNotFoundException;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.util.List;

@Service
public class TransactionService {

  private final TransactionRepository transactionRepo;
  private final BudgetService budgetService;

  public TransactionService(TransactionRepository transactionRepo) {
    this.transactionRepo = transactionRepo;
  }

  public Transaction getById(BigInteger id) {
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

  public List<Transaction> getAllTransactions(BigInteger userID) {
    return transactionRepo.findByUserID(userID);
  }

  public Transaction updateTransaction(BigInteger id, @NonNull CreateTransactionRequest req) {
    Transaction t = getById(id);
    t.setAmount(req.getAmount());
    t.setType(req.getType());
    t.setDate(req.getDate());
    t.setCategoryID(req.getCategoryID());
    t.setSource(req.getSource());
    t.setDescription(req.getDescription());
    return transactionRepo.save(t);
  }

  public void deleteTransaction(BigInteger id) {
    getById(id);
    transactionRepo.deleteById(id);
  }

  public List<Transaction> getIncomeTransactions(BigInteger userID) {
    return transactionRepo.findByUserIDAndType(userID, TransactionType.INCOME);
  }

  public List<Transaction> getExpenseTransactions(BigInteger userID) {
    return transactionRepo.findByUserIDAndType(userID, TransactionType.EXPENSE);
  }

  public Double getTotalIncome(int userID) {
    return transactionRepo.sumByUserIDAndType(userID, TransactionType.INCOME);
  }

  public Double getTotalExpense(int userID) {
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

}