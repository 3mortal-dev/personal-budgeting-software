package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.AuthenticationRequest;
import com.example.personal_budget.entity.Transaction;
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
    public ResponseEntity<Transaction> addTransaction(@Valid @RequestBody AuthenticationRequest.CreateTransactionRequest req) {
        Transaction saved = transactionService.addTransaction(userService.getUserIdByEmail(SecurityContextHolder.getContext().getAuthentication().getName()), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = transactionService.getAllTransactions(userService.getUserIdByEmail(SecurityContextHolder.getContext().getAuthentication().getName()));
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/income")
    public ResponseEntity<List<Transaction>> getIncomeTransactions() {
        List<Transaction> transactions = transactionService.getIncomeTransactions(userService.getUserIdByEmail(SecurityContextHolder.getContext().getAuthentication().getName()));
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/expense")
    public ResponseEntity<List<Transaction>> getExpenseTransactions() {
        List<Transaction> transactions = transactionService.getExpenseTransactions(userService.getUserIdByEmail(SecurityContextHolder.getContext().getAuthentication().getName()));
        return ResponseEntity.ok(transactions);
    }

    @PutMapping("/{transactionID}")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable Long transactionID, @Valid @RequestBody AuthenticationRequest.CreateTransactionRequest req) {
        Transaction t = transactionService.updateTransaction(transactionID, userService.getUserIdByEmail(SecurityContextHolder.getContext().getAuthentication().getName()), req);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(t);
    }

    @DeleteMapping("/{transactionID}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long transactionID) {
        transactionService.deleteTransaction(transactionID, userService.getUserIdByEmail(SecurityContextHolder.getContext().getAuthentication().getName()));
        return ResponseEntity.noContent().build();
    }
}