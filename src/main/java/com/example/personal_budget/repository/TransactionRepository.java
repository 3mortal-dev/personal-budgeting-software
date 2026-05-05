package com.example.personal_budget.repository;

import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, BigInteger> {
    List<Transaction> findByUserID(Long userID);

    List<Transaction> findByUserIDAndType(Long userID, TransactionType type);

    List<Transaction> findByUserIDAndDateBetweenAndCategoryID(
            Long userID, LocalDate start, LocalDate end, Long categoryID
    );

    @Query("""
                SELECT COALESCE(SUM(t.amount), 0)
                FROM Transaction t
                WHERE t.userID = :userID AND t.type = :type
            """)
    Double sumByUserIDAndType(Long userID, TransactionType transactionType);

    @Query("""
                SELECT MONTH(t.date) as month,
                COALESCE(SUM(t.amount), 0) as totalAmount
                FROM Transaction t
                WHERE t.userID = :userID
                  AND t.type = :type
                  AND t.date BETWEEN :startDate AND :endDate
                GROUP BY MONTH(t.date)
                ORDER BY MONTH(t.date)
            """)
    List<Object[]> getMonthlyTotal(Long userID, TransactionType type, LocalDate startDate, LocalDate endDate);

    @Query("""
                SELECT c.name,
                COALESCE(SUM(t.amount), 0)
                FROM Transaction t
                JOIN Category c ON t.categoryID = c.categoryID
                WHERE t.userID = :userID
                  AND t.type = :type
                GROUP BY c.name
            """)
    List<Object[]> getCategoryAmount(Long userID, TransactionType type);
}
