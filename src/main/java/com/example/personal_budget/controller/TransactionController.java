package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.CreateTransactionRequest;
import com.example.personal_budget.dto.request.TransactionFilterRequest;
import com.example.personal_budget.dto.response.TransactionResponse;
import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.service.CurrencyService;
import com.example.personal_budget.service.TransactionService;
import com.example.personal_budget.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final UserService userService;
    private final CurrencyService currencyService;

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
        long userId = userService.getUserId(userDetails);
        User user = userService.getUserById(userId);
        Transaction saved = transactionService.addTransaction(userId, request);
        TransactionResponse response = new TransactionResponse(saved, user.getCurrency());
        response.setAmount(currencyService.convert(saved.getAmount(), saved.getCurrency(), user.getCurrency()));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private User getUser(UserDetails userDetails) {
        return userService.getUser(userDetails);
    }

    private TransactionResponse toConvertedResponse(Transaction t, String userCurrency) {
        TransactionResponse tr = new TransactionResponse(t, userCurrency);
        tr.setAmount(currencyService.convert(t.getAmount(), t.getCurrency(), userCurrency));
        return tr;
    }

    private List<TransactionResponse> toConvertedList(List<Transaction> transactions, String userCurrency) {
        return transactions.stream()
                .map(t -> toConvertedResponse(t, userCurrency))
                .collect(Collectors.toList());
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
        User user = getUser(userDetails);
        return ResponseEntity.ok(toConvertedList(
                transactionService.getAllTransactions(user.getId()), user.getCurrency()));
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
        User user = getUser(userDetails);
        return ResponseEntity.ok(toConvertedList(
                transactionService.getIncomeTransactions(user.getId()), user.getCurrency()));
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
        User user = getUser(userDetails);
        return ResponseEntity.ok(toConvertedList(
                transactionService.getExpenseTransactions(user.getId()), user.getCurrency()));
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
        long userId = userService.getUserId(userDetails);
        User user = userService.getUserById(userId);
        Transaction updated = transactionService.updateTransaction(transactionId, userId, request);
        return ResponseEntity.ok(toConvertedResponse(updated, user.getCurrency()));
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
        User user = getUser(userDetails);
        return ResponseEntity.ok(toConvertedList(
                transactionService.filterHistory(user.getId(), request), user.getCurrency()));
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
        User user = getUser(userDetails);
        return ResponseEntity.ok(toConvertedList(
                transactionService.getRecentTransactions(user.getId()), user.getCurrency()));
    }
}
