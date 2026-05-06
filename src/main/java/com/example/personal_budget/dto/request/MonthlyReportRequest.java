package com.example.personal_budget.dto.request;

import java.time.LocalDate;

import lombok.Data;


@Data
public class MonthlyReportRequest {
    private long userId; // always null and set in controller
    private LocalDate startDate;
    private LocalDate endDate;

}