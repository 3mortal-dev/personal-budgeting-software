package com.example.personal_budget.controller;

import com.example.personal_budget.dto.response.BudgetResponse;
import com.example.personal_budget.dto.response.DashboardResponse;
import com.example.personal_budget.dto.response.TransactionResponse;
import com.example.personal_budget.service.BudgetService;
import com.example.personal_budget.service.GoalService;
import com.example.personal_budget.service.TransactionService;
import com.example.personal_budget.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final TransactionService transactionService;
    private final UserService userService;
    private final BudgetService budgetService;
    private final GoalService goalService;

    /**
     * Builds the dashboard summary for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return balances, monthly totals, recent transactions, active budgets, and active goals
     */
    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserId(userDetails);
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        double totalIncome = transactionService.getTotalIncome(userId);
        double totalExpense = transactionService.getTotalExpense(userId);
        double monthlyIncome = transactionService.getMonthlyIncome(userId, monthStart, today);
        double monthlyExpense = transactionService.getMonthlyExpense(userId, monthStart, today);

        List<TransactionResponse> recentTransactions = transactionService.getRecentTransactions(userId)
                .stream()
                .map(TransactionResponse::new)
                .toList();
        List<BudgetResponse> activeBudgetItems = budgetService.getActiveBudgets(userId, 2)
                .stream()
                .map(BudgetResponse::new)
                .toList();

        DashboardResponse response = new DashboardResponse();
        response.setTotalBalance(BigDecimal.valueOf(totalIncome).subtract(BigDecimal.valueOf(totalExpense)));
        response.setMonthlyIncome(BigDecimal.valueOf(monthlyIncome));
        response.setMonthlyExpense(BigDecimal.valueOf(monthlyExpense));
        response.setRecentTransactions(recentTransactions);
        response.setActiveBudgets(Math.toIntExact(budgetService.countActiveBudgets(userId)));
        response.setActiveBudgetItems(activeBudgetItems);
        response.setActiveGoals(goalService.getActiveGoalsCount(userId));
        response.setNumberOfTransactions(transactionService.getNumberOfTransactions(userId));

        return ResponseEntity.ok(response);
    }
}
