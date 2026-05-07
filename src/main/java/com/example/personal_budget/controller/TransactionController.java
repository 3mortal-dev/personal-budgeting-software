package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.CreateTransactionRequest;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.service.TransactionService;
import com.example.personal_budget.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping ("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Transaction> addTransaction (@Valid @RequestBody CreateTransactionRequest request,
                                                       @AuthenticationPrincipal UserDetails userDetails) {

        Transaction saved = transactionService.addTransaction(userService.getUserId(userDetails), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions (@AuthenticationPrincipal UserDetails userDetails) {

        List<Transaction> transactions = transactionService.getAllTransactions(userService.getUserId(userDetails));

        return ResponseEntity.ok(transactions);
    }

    @GetMapping ("/income")
    public ResponseEntity<List<Transaction>> getIncomeTransactions (@AuthenticationPrincipal UserDetails userDetails) {

        List<Transaction> transactions = transactionService.getIncomeTransactions(userService.getUserId(userDetails));

        return ResponseEntity.ok(transactions);
    }

    @GetMapping ("/expense")
    public ResponseEntity<List<Transaction>> getExpenseTransactions (@AuthenticationPrincipal UserDetails userDetails) {

        List<Transaction> transactions = transactionService.getExpenseTransactions(userService.getUserId(userDetails));

        return ResponseEntity.ok(transactions);
    }

    @PutMapping ("/{transactionID}")
    public ResponseEntity<Transaction> updateTransaction (@PathVariable Long transactionID,
                                                          @Valid @RequestBody CreateTransactionRequest request,
                                                          @AuthenticationPrincipal UserDetails userDetails) {

        Transaction t = transactionService.updateTransaction(transactionID, userService.getUserId(userDetails),
                                                             request);

        return ResponseEntity.ok(t);
    }


    @DeleteMapping ("/{transactionID}")
    public ResponseEntity<Void> deleteTransaction (@PathVariable Long transactionID,
                                                   @AuthenticationPrincipal UserDetails userDetails) {

        transactionService.deleteTransaction(transactionID, userService.getUserId(userDetails));

        return ResponseEntity.noContent().build();
    }
}