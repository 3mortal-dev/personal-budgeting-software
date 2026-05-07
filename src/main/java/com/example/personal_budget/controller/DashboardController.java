package com.example.personal_budget.controller;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.personal_budget.dto.response.DashboardResponse;
import com.example.personal_budget.service.BudgetService;
import com.example.personal_budget.service.GoalService;
import com.example.personal_budget.service.TransactionService;
import com.example.personal_budget.service.UserService;
import com.example.personal_budget.entity.Transaction;

@RestController("/dashboard")
public class DashboardController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserService userService;

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private GoalService goalService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        // Fetch necessary data for the dashboard
        double totalIncome = transactionService.getTotalIncome(userId);
        double totalExpenses = transactionService.getTotalExpense(userId);
        BigDecimal totalBalance = BigDecimal.valueOf(totalIncome).subtract(BigDecimal.valueOf(totalExpenses));

        // double monthlyIncome = transactionService.getMonthIncome(userId, LocalTime.now().getMonth());
        // double monthlyExpenses = transactionService.getMonthexpense(userId, LocalTime.now().getMonth());

        List<Transaction> recentTransactions = transactionService.getRecentTransactions(userId);

        // Integer numberofTransactions = transactionService.getNumberOfTransactions(userId);
        Integer ActiveGoals = goalService.getActiveGoalsCount(userId);
        // List<Budget> = userService.getBudgetAlertCount(userId);
        
        // DashboardResponse response = new DashboardResponse(totalBalance, monthlyIncome, monthlyExpenses, recentTransactions, ActiveGoals,);

        return ResponseEntity.ok(response);
    }
    
}