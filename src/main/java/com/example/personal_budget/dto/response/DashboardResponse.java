package com.example.personal_budget.dto.response;

import java.math.BigDecimal;

import lombok.Data;
import java.util.List;
import com.example.personal_budget.entity.GoalEntity;
import com.example.personal_budget.entity.Transaction;
@Data
public class DashboardResponse {
    private Long userId;
    private BigDecimal totalBalance;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpense;
    private List<Transaction> recentTransactions;
    private List<GoalEntity> goals;
    // private List<Budget> budgets;
}
