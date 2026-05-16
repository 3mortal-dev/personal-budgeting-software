package com.example.personal_budget.repository;

import com.example.personal_budget.entity.MockBankTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Persistence layer for unsynced bank-simulator records.
 */
@Repository
public interface MockBankTransactionRepository extends JpaRepository<MockBankTransaction, Long> {

    /**
     * Returns every record that has not yet been imported into the main
     * transactions table.
     *
     * @return unsynced bank transactions
     */
    List<MockBankTransaction> findBySyncedFalse();
}
