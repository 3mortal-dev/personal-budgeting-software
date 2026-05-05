package com.example.personal_budget.repository;

import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserID(Long userID);

    List<Transaction> findByUserIDAndType(Long userID, TransactionType type);

    List<Transaction> findByUserIDAndDateBetweenAndCategoryID(
            Long userID, LocalDate start, LocalDate end, Long categoryID
    );
      
    List<Transaction> findByUserIDAndDateBetween(
            Long userID, LocalDate start, LocalDate end
    );

    @Query("""
                SELECT COALESCE(SUM(t.amount), 0)
                FROM Transaction t
                WHERE t.userID = :userID AND t.type = :type
            """)
    Double sumByUserIDAndType(Long userID, TransactionType transactionType);

    @Query(nativeQuery = true, value = """
                SELECT EXTRACT(MONTH FROM t.date) as month,
                COALESCE(SUM(t.amount), 0) as total_amount
                FROM transactions t
                WHERE t.user_id = :userID
                  AND t.type = :type
                  AND t.date BETWEEN :startDate AND :endDate
                GROUP BY EXTRACT(MONTH FROM t.date)
                ORDER BY EXTRACT(MONTH FROM t.date)
            """)
    List<Object[]> getMonthlyTotal(Long userID, TransactionType type, LocalDate startDate, LocalDate endDate);

    @Query(nativeQuery = true, value = """
                SELECT c.name, COALESCE(SUM(t.amount), 0)
                FROM transactions t
                JOIN categories c ON t.category_id = c.category_id
                WHERE t.user_id = :userID
                  AND t.type = :type
                GROUP BY c.name
            """)
    List<Object[]> getCategoryAmount(Long userID, TransactionType type);
}
