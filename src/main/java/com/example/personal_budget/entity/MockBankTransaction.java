package com.example.personal_budget.entity;

import com.example.personal_budget.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents a pending transaction that was recorded in the external Mock Bank
 * (via /bank-simulator). These records are held until the user clicks "Sync Now"
 * on the Profile page, at which point they are imported into the main
 * Transaction table and this record is marked as synced.
 */
@Entity
@Table(name = "mock_bank_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockBankTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Raw amount as supplied by the bank simulator form. */
    @Column(nullable = false)
    private double amount;

    /** Short human-readable label (e.g. "Starbucks", "Amazon Purchase"). */
    @Column(nullable = false)
    private String description;

    /** INCOME or EXPENSE – mirrors TransactionType. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    /**
     * ISO-8601 timestamp sent by the bankSimulator.html front-end
     * (new Date().toISOString()).
     */
    @Column(nullable = false)
    private LocalDateTime date;

    /**
     * False until the user triggers a sync. Once true this record will
     * never be imported again.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean synced = false;
}
