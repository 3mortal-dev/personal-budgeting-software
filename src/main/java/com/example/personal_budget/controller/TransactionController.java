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

    /**
     * Creates a transaction for the authenticated user.
     *
     * @param request the transaction details
     * @param userDetails the authenticated principal
     * @return the created transaction
     */
    @PostMapping
    public ResponseEntity<TransactionResponse> addTransaction(
            @Valid @RequestBody CreateTransactionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        TransactionResponse response = new TransactionResponse(
                transactionService.addTransaction(userService.getUserId(userDetails), request));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists all transactions for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return the user's transactions
     */
    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAllTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.getAllTransactions(
                userService.getUserId(userDetails)).stream().map(TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }

    /**
     * Lists income transactions for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return income transactions
     */
    @GetMapping("/income")
    public ResponseEntity<List<TransactionResponse>> getIncomeTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.getIncomeTransactions(
                userService.getUserId(userDetails)).stream().map(TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }

    /**
     * Lists expense transactions for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return expense transactions
     */
    @GetMapping("/expense")
    public ResponseEntity<List<TransactionResponse>> getExpenseTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.getExpenseTransactions(
                userService.getUserId(userDetails)).stream().map(TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }

    /**
     * Updates a transaction owned by the authenticated user.
     *
     * @param transactionId the transaction id
     * @param request the replacement transaction details
     * @param userDetails the authenticated principal
     * @return the updated transaction
     */
    @PutMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable Long transactionId,
            @Valid @RequestBody CreateTransactionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        TransactionResponse response = new TransactionResponse(
                transactionService.updateTransaction(transactionId, userService.getUserId(userDetails), request));

        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a transaction owned by the authenticated user.
     *
     * @param transactionId the transaction id
     * @param userDetails the authenticated principal
     * @return an empty no-content response
     */
    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long transactionId,
            @AuthenticationPrincipal UserDetails userDetails) {

        transactionService.deleteTransaction(transactionId, userService.getUserId(userDetails));

        return ResponseEntity.noContent().build();
    }

    /**
     * Filters the authenticated user's transaction history.
     *
     * @param request the filter criteria
     * @param userDetails the authenticated principal
     * @return matching transactions
     */
    @PostMapping("/filter")
    public ResponseEntity<List<TransactionResponse>> filterTransactions(
            @RequestBody TransactionFilterRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.filterHistory(userService.getUserId(userDetails),
                                                                                  request).stream().map(
                TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }

    /**
     * Lists the authenticated user's most recent transactions.
     *
     * @param userDetails the authenticated principal
     * @return recent transactions ordered newest first
     */
    @GetMapping("/recent")
    public ResponseEntity<List<TransactionResponse>> getRecentTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionResponse> transactions = transactionService.getRecentTransactions(
                userService.getUserId(userDetails)).stream().map(TransactionResponse::new).collect(Collectors.toList());

        return ResponseEntity.ok(transactions);
    }
}
