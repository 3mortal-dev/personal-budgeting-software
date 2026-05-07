package com.example.personal_budget.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.example.personal_budget.entity.GoalEntity;
import com.example.personal_budget.entity.Transaction;

import lombok.Data;

@Data
public class DashboardResponse {
    private BigDecimal totalBalance;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpense;
    private List<Transaction> recentTransactions;
    private Integer ActiveBudgets;
    private Integer ActiveGoals;
    private Integer numberOfTransactions;
    // private List<Budget> budgets;
}
