package com.example.personal_budget.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TransactionFilterRequest {
    private LocalDate startDate;
    private LocalDate endDate;
    private Long categoryId;
}
