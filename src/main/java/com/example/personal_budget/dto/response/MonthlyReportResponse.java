package com.example.personal_budget.dto.response;

import java.time.Month;
import java.util.Map;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class MonthlyReportResponse {
    private Map<Month, Double> monthlyExpense;
    private Map<Month, Double> monthlyIncome;
    private Map<String, Double> expenseByCategory;

    public MonthlyReportResponse(Map<Month, Double> monthlyExpense, Map<Month, Double> monthlyIncome, Map<String, Double> expenseByCategory) {
        this.monthlyExpense = monthlyExpense;
        this.monthlyIncome = monthlyIncome;
        this.expenseByCategory = expenseByCategory;
    }
}