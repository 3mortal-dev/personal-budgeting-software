package com.example.personal_budget.controller;

import com.example.personal_budget.dto.CreateTransactionRequest;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.service.TransactionService;
import com.example.personal_budget.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Transaction> addTransaction(@Valid @RequestBody CreateTransactionRequest req) {
        Transaction saved = transactionService.addTransaction(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = transactionService.getAllTransactions(getCurrentUser().getID());
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/income")
    public ResponseEntity<List<Transaction>> getIncomeTransactions() {
        List<Transaction> transactions = transactionService.getIncomeTransactions(getCurrentUser().getID());
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/expense")
    public ResponseEntity<List<Transaction>> getExpenseTransactions() {
        List<Transaction> transactions = transactionService.getExpenseTransactions(getCurrentUser().getID());
        return ResponseEntity.ok(transactions);
    }

    @PutMapping("/{transactionID}")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable Long transactionID, @Valid @RequestBody CreateTransactionRequest req) {
        Transaction t = transactionService.updateTransaction(transactionID, getCurrentUser().getID(), req);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(t);
    }

    @DeleteMapping("/{transactionID}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long transactionID) {
        transactionService.deleteTransaction(transactionID, getCurrentUser().getID);
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        return userService.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}