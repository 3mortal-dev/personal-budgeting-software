package com.example.personal_budget.dto.response;

import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MonthlyReportResponse {
    private String month;
    private double income;
    private double expense;
    private double net;
    private Map<String, Double> expenseByCategory;

}