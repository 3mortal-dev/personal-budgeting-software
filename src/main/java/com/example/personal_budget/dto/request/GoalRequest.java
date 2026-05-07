package com.example.personal_budget.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class GoalRequest {
    private String goalName;
    private Double targetAmount;
    private Double savedAmount;
    private LocalDate deadline;
    private String iconClass;
    private String iconColor;
}