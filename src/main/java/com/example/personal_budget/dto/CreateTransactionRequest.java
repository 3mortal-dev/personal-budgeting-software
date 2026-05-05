package com.example.personal_budget.dto;

import com.example.personal_budget.enums.TransactionType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigInteger;
import java.time.LocalDate;

@Data
public class CreateTransactionRequest {
  private Long userID;

  @Positive(message = "Amount must be positive")
  private double amount;

  @NotNull(message = "Type can't be null")
  private TransactionType type;

  @JsonFormat(pattern = "yyyy-MM-dd")
  private LocalDate date;

  private Long categoryID;
  private String source;
  private String description;
}
