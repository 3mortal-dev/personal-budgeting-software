package com.example.personal_budget.dto.response;

import java.math.BigDecimal;
import java.util.List;
import com.example.personal_budget.dto.response.TransactionDTO;
import com.example.personal_budget.dto.response.GoalDTO;
import com.example.personal_budget.dto.response.BudgetDTO;

import lombok.Data;

@Data
public class DashboardResponse {
    private BigDecimal totalBalance;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpense;
    private List<TransactionDTO> recentTransactions;
    private List<GoalDTO> goals;
    private List<BudgetDTO> budgets;
}
