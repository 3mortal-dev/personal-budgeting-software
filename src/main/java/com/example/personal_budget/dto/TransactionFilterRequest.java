package com.example.personal_budget.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TransactionFilterRequest {
    private Long userID;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long categoryID;
}
