package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.CreateTransactionRequest;
import com.example.personal_budget.dto.request.TransactionFilterRequest;
import com.example.personal_budget.dto.response.TransactionResponse;
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
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<TransactionResponse> addTransaction(
            @Valid @RequestBody CreateTransactionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        TransactionResponse response = new TransactionResponse(
                transactionService.addTransaction(userService.getUserId(userDetails), request));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAllTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.getAllTransactions(
                userService.getUserId(userDetails)).stream().map(TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/income")
    public ResponseEntity<List<TransactionResponse>> getIncomeTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.getIncomeTransactions(
                userService.getUserId(userDetails)).stream().map(TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/expense")
    public ResponseEntity<List<TransactionResponse>> getExpenseTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.getExpenseTransactions(
                userService.getUserId(userDetails)).stream().map(TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }

    @PutMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable Long transactionId,
            @Valid @RequestBody CreateTransactionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        TransactionResponse response = new TransactionResponse(
                transactionService.updateTransaction(transactionId, userService.getUserId(userDetails), request));

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long transactionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        transactionService.deleteTransaction(transactionId, userService.getUserId(userDetails));

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/filter")
    public ResponseEntity<List<TransactionResponse>> filterTransactions(
            @RequestBody TransactionFilterRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.filterHistory(userService.getUserId(userDetails),
                                                                                  request).stream().map(
                TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<TransactionResponse>> getRecentTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.getRecentTransactions(
                userService.getUserId(userDetails)).stream().map(TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }
}