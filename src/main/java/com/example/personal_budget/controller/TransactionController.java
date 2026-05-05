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
        return ResponseEntity.status(HttpStatus.CREATED).body(new Transaction(saved));
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Transaction> transactions = transactionService.getAllTransactions(user.getID);
        return ResponseEntity.ok(transactions);
    }
}