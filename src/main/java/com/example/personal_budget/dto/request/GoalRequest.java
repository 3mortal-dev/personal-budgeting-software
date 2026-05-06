package com.example.personal_budget.dto.request;

import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class GoalRequest {
    private String goalName;
    private double targetAmount;
    private LocalDate deadline;
}
