package com.example.personal_budget.repository;

import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // JPA generates from method name
    List<Transaction> findByUserID(Long userID);

    List<Transaction> findByUserIDAndType(Long userID, TransactionType type);

    List<Transaction> findByUserIDAndDateBetween(Long userID, LocalDate start, LocalDate end);

    List<Transaction> findByUserIDAndDateBetweenAndCategoryID(Long userID, LocalDate start, LocalDate end, Long categoryID);

    // Dashboard
    List<Transaction> findTop5ByUserIDOrderByDateDescIdDesc(Long userID);

    // Sum income or expense
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.userID = :userID
            AND t.type = :type
            """)
    Double sumByUserIDAndType(
            @Param("userID") Long userID,
            @Param("type") TransactionType type
    );

    // Monthly totals — for reports
    @Query("""
            SELECT FUNCTION('MONTH', t.date), COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.userID = :userID
            AND t.type = :type
            AND t.date BETWEEN :startDate AND :endDate
            GROUP BY FUNCTION('MONTH', t.date)
            ORDER BY FUNCTION('MONTH', t.date)
            """)
    List<Object[]> getMonthlyTotal(
            @Param("userID") Long userID,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Category breakdown — for reports
    @Query("""
            SELECT c.name, COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            JOIN Category c ON t.categoryID = c.id
            WHERE t.userID = :userID
            AND t.type = :type
            GROUP BY c.name
            """)
    List<Object[]> getCategoryAmount(
            @Param("userID") Long userID,
            @Param("type") TransactionType type
    );

    // Date range — for reports
    @Query("""
            SELECT t FROM Transaction t
            WHERE t.userID = :userID
            AND t.date BETWEEN :startDate AND :endDate
            ORDER BY t.date DESC
            """)
    List<Transaction> findByUserIDAndDateBetweenOrdered(
            @Param("userID") Long userID,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
