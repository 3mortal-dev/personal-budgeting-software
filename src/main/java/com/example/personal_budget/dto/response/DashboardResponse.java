package com.example.personal_budget.dto.response;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class DashboardResponse {
    private Long userId;
    private BigDecimal totalBalance;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpense;
    private List<Transaction> recentTransactions;
    private List<Goal> goals;
    private List<Budget> budgets;
}
