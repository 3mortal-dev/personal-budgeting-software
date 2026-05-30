package com.example.personal_budget.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import com.example.personal_budget.dto.request.CreateBudgetRequest;
import com.example.personal_budget.dto.response.BudgetResponse;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.service.BudgetService;
import com.example.personal_budget.service.CurrencyService;
import com.example.personal_budget.service.UserService;
import com.example.personal_budget.entity.Budget;

import java.util.List;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    private final UserService userService;
    private final CurrencyService currencyService;

    private BudgetResponse toResponse(Budget budget, String userCurrency) {
        BudgetResponse br = new BudgetResponse(budget, userCurrency);
        br.setSpendingLimit(currencyService.convert(budget.getSpendingLimit(), "USD", userCurrency));
        br.setSpentAmount(currencyService.convert(budget.getSpentAmount(), "USD", userCurrency));
        return br;
    }

    private List<BudgetResponse> toResponseList(List<Budget> budgets, String userCurrency) {
        return budgets.stream()
                .map(b -> toResponse(b, userCurrency))
                .toList();
    }

    private User getUser(UserDetails userDetails) {
        return userService.getUser(userDetails);
    }

    /**
     * Lists all budgets for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return the user's budgets
     */
    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAllBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(toResponseList(budgetService.getAllBudgets(user.getId()), user.getCurrency()));
    }

    /**
     * Lists active budgets for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return active budgets
     */
    @GetMapping("/active")
    public ResponseEntity<List<BudgetResponse>> getActiveBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(toResponseList(budgetService.getActiveBudgets(user.getId()), user.getCurrency()));
    }

    /**
     * Lists budgets that are near their spending limit.
     *
     * @param userDetails the authenticated principal
     * @return near-limit budgets
     */
    @GetMapping("/near-limit")
    public ResponseEntity<List<BudgetResponse>> getNearLimitBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(toResponseList(budgetService.getNearLimitBudgets(user.getId()), user.getCurrency()));
    }

    /**
     * Lists budgets that have exceeded their spending limit.
     *
     * @param userDetails the authenticated principal
     * @return exceeded-limit budgets
     */
    @GetMapping("/Exeeded-limit")
    public ResponseEntity<List<BudgetResponse>> getExeededLimitBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(toResponseList(budgetService.getExeededLimitBudgets(user.getId()), user.getCurrency()));
    }

    /**
     * Lists expired budgets for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return expired budgets
     */
    @GetMapping("/expired")
    public ResponseEntity<List<BudgetResponse>> getExpiredBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(toResponseList(budgetService.getExpiredBudgets(user.getId()), user.getCurrency()));
    }

    /**
     * Creates a budget for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @param request the budget details
     * @return the created budget
     */
    @PostMapping
    public ResponseEntity<BudgetResponse> addBudget(@AuthenticationPrincipal UserDetails userDetails, @Valid @RequestBody CreateBudgetRequest request) {
        User user = getUser(userDetails);
        Budget budget = budgetService.addBudget(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(budget, user.getCurrency()));
    }

    /**
     * Updates a budget owned by the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @param budgetID the budget id
     * @param request the replacement budget details
     * @return the updated budget
     */
    @PutMapping("/{budgetID}")
    public ResponseEntity<BudgetResponse> editBudget(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long budgetID, @Valid @RequestBody CreateBudgetRequest request) {
        User user = getUser(userDetails);
        Budget budget = budgetService.editBudget(user.getId(), budgetID, request);
        return ResponseEntity.ok(toResponse(budget, user.getCurrency()));
    }

    /**
     * Deletes a budget owned by the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @param budgetID the budget id
     * @return an empty no-content response
     */
    @DeleteMapping("/{budgetID}")
    public ResponseEntity<Void> deleteBudget(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long budgetID) {
        budgetService.deleteBudgetById(userService.getUserId(userDetails), budgetID);
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes all budgets owned by the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return an empty no-content response
     */
    @DeleteMapping("/delete-all")
    public ResponseEntity<Void> deleteAllBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        budgetService.deleteAllBudgets(userService.getUserId(userDetails));
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes expired budgets owned by the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return an empty no-content response
     */
    @DeleteMapping("/delete-expired")
    public ResponseEntity<Void> deleteExpiredBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        budgetService.deleteExpiredBudgets(userService.getUserId(userDetails));
        return ResponseEntity.noContent().build();
    }
}
