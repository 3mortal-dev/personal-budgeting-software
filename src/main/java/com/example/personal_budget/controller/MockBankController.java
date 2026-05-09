package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.CreateTransactionRequest;
import com.example.personal_budget.enums.TransactionType;
import com.example.personal_budget.entity.MockBankTransaction;
import com.example.personal_budget.repository.MockBankTransactionRepository;
import com.example.personal_budget.service.TransactionService;
import com.example.personal_budget.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

/**
 * Mock Bank API
 * ─────────────────────────────────────────────────────────────────
 *
 * POST /api/mock-bank/add
 *   Called by bankSimulator.html to record a pending bank transaction.
 *   No authentication required – this simulates an external bank API.
 *
 * POST /api/bank/sync
 *   Called by userProfile.js → simulateSync() when the user clicks
 *   "Sync Now". Authenticated. Imports every unsynced bank record into
 *   the authenticated user's transaction history and marks them synced.
 *
 * GET  /api/mock-bank/pending
 *   Optional helper endpoint (useful during development) that lists all
 *   unsynced bank records so you can verify them before syncing.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class MockBankController {

    private final MockBankTransactionRepository mockBankRepo;
    private final TransactionService            transactionService;
    private final UserService                   userService;


    /**
     * Request body expected by POST /api/mock-bank/add.
     *
     * <pre>
     * {
     *   "amount":      45.99,
     *   "description": "Amazon Purchase",
     *   "type":        "EXPENSE",          // "EXPENSE" | "INCOME"
     *   "date":        "2025-05-09T14:30:00.000Z"   // ISO-8601
     * }
     * </pre>
     */
    public record BankTransactionRequest(
            @NotNull @Positive
            Double amount,

            @NotBlank
            String description,

            @NotNull
            TransactionType type,

            String date
    ) {}



    public record SyncResponse(int count, String message) {}

    /**
     * Receives a transaction from the Mock Bank Simulator and persists it
     * as an unsynced {@link MockBankTransaction}.
     * <p>
     * This endpoint is intentionally left <em>unauthenticated</em> to mimic
     * an external bank that pushes data asynchronously.
     */
    @PostMapping("/api/mock-bank/add")
    public ResponseEntity<Map<String, String>> addBankTransaction(
            @Valid @RequestBody BankTransactionRequest request) {

        java.time.LocalDateTime dateTime;
        try {
            dateTime = Instant.parse(request.date()).atZone(ZoneId.systemDefault()).toLocalDateTime();
        } catch (Exception e) {
            log.warn("Could not parse bank date '{}', defaulting to now.", request.date());
            dateTime = java.time.LocalDateTime.now();
        }

        MockBankTransaction record = MockBankTransaction.builder()
                .amount(request.amount())
                .description(request.description())
                .type(request.type())
                .date(dateTime)
                .synced(false)
                .build();

        mockBankRepo.save(record);

        log.info("Mock bank recorded: {} {} – {}",
                request.type(), request.amount(), request.description());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of("message", "Transaction recorded at the bank!"));
    }


    /**
     * Imports every unsynced {@link MockBankTransaction} into the
     * authenticated user's main transaction history.
     *
     * <ul>
     *   <li>EXPENSE transactions are imported with no category (null categoryId)
     *       so the user can categorise them afterward.</li>
     *   <li>INCOME transactions use the description as the source field.</li>
     *   <li>Each record is marked {@code synced = true} after a successful import
     *       so it is never imported twice.</li>
     * </ul>
     */
    @PostMapping("/api/bank/sync")
    public ResponseEntity<SyncResponse> syncBankTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        long userId = userService.getUserId(userDetails);

        List<MockBankTransaction> pending = mockBankRepo.findBySyncedFalse();

        if (pending.isEmpty()) {
            return ResponseEntity.ok(
                    new SyncResponse(0, "No new transactions to sync."));
        }

        int importedCount = 0;

        for (MockBankTransaction bankTx : pending) {
            try {
                CreateTransactionRequest txRequest = buildTransactionRequest(bankTx);
                transactionService.addTransaction(userId, txRequest);

                bankTx.setSynced(true);
                mockBankRepo.save(bankTx);

                importedCount++;
            } catch (Exception ex) {
                // Log and continue – one bad record shouldn't abort the whole sync
                log.error("Failed to import bank transaction id={}: {}",
                        bankTx.getId(), ex.getMessage());
            }
        }

        String message = importedCount == 1
                ? "Successfully synced 1 transaction from your bank."
                : String.format("Successfully synced %d transactions from your bank.", importedCount);

        log.info("Bank sync complete for userId={}: {} imported, {} skipped.",
                userId, importedCount, pending.size() - importedCount);

        return ResponseEntity.ok(new SyncResponse(importedCount, message));
    }

    /**
     * Returns every bank record that has not yet been synced.
     * Useful during development to verify the simulator is working
     * before triggering a full sync.
     */
    @GetMapping("/api/mock-bank/pending")
    public ResponseEntity<List<MockBankTransaction>> getPendingTransactions() {
        return ResponseEntity.ok(mockBankRepo.findBySyncedFalse());
    }

    /**
     * Maps a {@link MockBankTransaction} to the {@link CreateTransactionRequest}
     * format expected by {@link TransactionService#addTransaction}.
     */
    private CreateTransactionRequest buildTransactionRequest(MockBankTransaction bankTx) {
        CreateTransactionRequest req = new CreateTransactionRequest();

        req.setAmount(bankTx.getAmount());
        req.setType(bankTx.getType());
        req.setDate(bankTx.getDate().toLocalDate());

        req.setDescription("🏦 " + bankTx.getDescription());

        if (bankTx.getType() == TransactionType.INCOME) {
            req.setSource(bankTx.getDescription());
            req.setCategoryId(null);
        } else {
            req.setSource(null);
            req.setCategoryId(9L);
        }

        return req;
    }
}
