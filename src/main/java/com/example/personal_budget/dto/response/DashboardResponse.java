package com.example.personal_budget.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardResponse {
    private BigDecimal totalBalance;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpense;
    private List<TransactionResponse> recentTransactions;
    private Integer activeBudgets;
    private List<BudgetResponse> activeBudgetItems;
    private Integer activeGoals;
    private Integer numberOfTransactions;
    private String currency;
}
