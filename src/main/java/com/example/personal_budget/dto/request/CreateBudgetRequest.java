package com.example.personal_budget.dto.request;

import com.example.personal_budget.enums.BudgetStatus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateBudgetRequest {

    Long categoryId;
    Double spendingLimit;
    @Min(0)
    @Max(100)
    private Double threshold;
    LocalDate endDate;
}
