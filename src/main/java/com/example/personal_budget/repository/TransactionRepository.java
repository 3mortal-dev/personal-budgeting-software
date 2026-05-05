package com.example.personal_budget.repository;

import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, BigInteger> {
  List<Transaction> findByUserID(BigInteger userID);
  List<Transaction> findByUserIDAndType(BigInteger userID, TransactionType type);
  List<Transaction> findByUserIDAndDateBetweenAndCategoryID(
          BigInteger userID, LocalDate start, LocalDate end, BigInteger categoryID
  );

  @Query("""
    SELECT COALESCE(SUM(t.amount), 0)
    FROM Transaction t
    WHERE t.userID = :userID AND t.type = :type
""")
  Double sumByUserIDAndType(int userID, TransactionType transactionType);
}
