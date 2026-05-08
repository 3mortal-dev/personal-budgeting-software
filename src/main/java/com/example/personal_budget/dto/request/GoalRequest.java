package com.example.personal_budget.dto.request;

import lombok.Data;
import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
@Data
public class GoalRequest {

    private String goalName;

    @Positive(message = "Target amount must be positive")
    @NotNull(message = "Target amount is required")
    private Double targetAmount;

    @NotNull(message = "Deadline is required")
    private LocalDate deadline;
    
    private String iconClass;
    private String iconColor;
}
