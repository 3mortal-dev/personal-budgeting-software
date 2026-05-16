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
import com.example.personal_budget.service.BudgetService;
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

    private BudgetResponse toResponse(Budget budget) {
        return new BudgetResponse(budget);
    }

    private List<BudgetResponse> toResponseList(List<Budget> budgets) {
        return budgets.stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Lists all budgets for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return the user's budgets
     */
    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAllBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        List<BudgetResponse> budgets = toResponseList(budgetService.getAllBudgets(userService.getUserId(userDetails)));
        return ResponseEntity.ok(budgets);
    }

    /**
     * Lists active budgets for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return active budgets
     */
    @GetMapping("/active")
    public ResponseEntity<List<BudgetResponse>> getActiveBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        List<BudgetResponse> budgets = toResponseList(budgetService.getActiveBudgets(userService.getUserId(userDetails)));
        return ResponseEntity.ok(budgets);
    }

    /**
     * Lists budgets that are near their spending limit.
     *
     * @param userDetails the authenticated principal
     * @return near-limit budgets
     */
    @GetMapping("/near-limit")
    public ResponseEntity<List<BudgetResponse>> getNearLimitBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        List<BudgetResponse> budgets = toResponseList(budgetService.getNearLimitBudgets(userService.getUserId(userDetails)));
        return ResponseEntity.ok(budgets);
    }

    /**
     * Lists budgets that have exceeded their spending limit.
     *
     * @param userDetails the authenticated principal
     * @return exceeded-limit budgets
     */
    @GetMapping("/Exeeded-limit")
    public ResponseEntity<List<BudgetResponse>> getExeededLimitBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        List<BudgetResponse> budgets = toResponseList(budgetService.getExeededLimitBudgets(userService.getUserId(userDetails)));
        return ResponseEntity.ok(budgets);
    }

    /**
     * Lists expired budgets for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return expired budgets
     */
    @GetMapping("/expired")
    public ResponseEntity<List<BudgetResponse>> getExpiredBudgets(@AuthenticationPrincipal UserDetails userDetails) {
        List<BudgetResponse> budgets = toResponseList(budgetService.getExpiredBudgets(userService.getUserId(userDetails)));
        return ResponseEntity.ok(budgets);
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
        BudgetResponse budget = toResponse(budgetService.addBudget(userService.getUserId(userDetails), request));
        return ResponseEntity.status(HttpStatus.CREATED).body(budget);
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
        BudgetResponse budget = toResponse(budgetService.editBudget(userService.getUserId(userDetails), budgetID, request));
        return ResponseEntity.ok(budget);
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
