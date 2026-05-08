package com.example.personal_budget.dto.request;

import lombok.Data;
import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;

@Data
public class GoalRequest {

    private String goalName;

    @NotNull(message = "Target amount is required")
    private Double targetAmount;

    @NotNull(message = "Deadline is required")
    private LocalDate deadline;

    private Double savedAmount;
    private String iconClass;
    private String iconColor;
}
