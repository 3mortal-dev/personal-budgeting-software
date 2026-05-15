package com.example.personal_budget.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Basic — JPA generates from method name
    List<Transaction> findByUserId(Long userId);

    List<Transaction> findByUserIdAndType(Long userId, TransactionType type);

    List<Transaction> findByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);

    List<Transaction> findByUserIdAndDateBetweenAndCategoryId(Long userId, LocalDate start, LocalDate end, Long categoryId);

    // Dashboard — last 5
    List<Transaction> findTop5ByUserIdOrderByDateDescIdDesc(Long userId);

    Integer countByUserId(Long userId);

    // Sum income or expense
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.user.id = :userId
            AND t.type = :type
            """)
    Double sumByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.user.id = :userId
            AND t.type = :type
            AND t.date BETWEEN :startDate AND :endDate
            """)
    Double sumByUserIdAndTypeAndDateBetween(@Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query(value = """
			SELECT EXTRACT(MONTH FROM date), COALESCE(SUM(amount), 0)
			FROM transactions
			WHERE user_id = :userId
			AND type = CAST(:type AS VARCHAR)
			AND date BETWEEN :startDate AND :endDate
			GROUP BY EXTRACT(MONTH FROM date)
			ORDER BY EXTRACT(MONTH FROM date)
			""", nativeQuery = true)
    List<Object[]> getMonthlyTotal(@Param("userId") Long userId,
            @Param("type") String type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Category breakdown — for reports
    @Query("""
            SELECT t.category.name, COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.user.id = :userId
            AND t.type = :type
            GROUP BY t.category.name
            """)
    List<Object[]> getCategoryAmount(@Param("userId") Long userId,
            @Param("type") TransactionType type);

    // Date range — for reports
    @Query("""
            SELECT t FROM Transaction t
            WHERE t.user.id = :userId
            AND t.date BETWEEN :startDate AND :endDate
            ORDER BY t.date DESC
            """)
    List<Transaction> findByUserIdAndDateBetweenOrdered(@Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
