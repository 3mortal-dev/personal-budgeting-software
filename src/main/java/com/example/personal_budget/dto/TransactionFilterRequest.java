package com.example.personal_budget.dto;

import lombok.Data;

import java.math.BigInteger;
import java.time.LocalDate;

@Data
public class TransactionFilterRequest {
  private BigInteger userID;
  private LocalDate startDate;
  private LocalDate endDate;
  private BigInteger categoryID;
}
