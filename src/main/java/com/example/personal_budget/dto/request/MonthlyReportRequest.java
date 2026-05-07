package com.example.personal_budget.dto.request;

import lombok.Data;

import java.time.LocalDate;


@Data
public class MonthlyReportRequest {
    private LocalDate startDate;
    private LocalDate endDate;
}