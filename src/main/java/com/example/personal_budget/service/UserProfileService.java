package com.example.personal_budget.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.example.personal_budget.dto.request.UserProfileRequest;
import com.example.personal_budget.dto.response.UserProfileResponse;
import com.example.personal_budget.entity.User;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class UserProfileService {

    private final UserService userService;
    private final GoalService goalService;
    private final TransactionService transactionService;
    private final BudgetService budgetService;

    private UserProfileResponse toDTO(User user) {

        int goalsCount = goalService.getGoalsByUserId(user.getId()).size();
        int transactionsCount = transactionService.getNumberOfTransactions(user.getId());
        int budgetsCount = budgetService.getAllBudgets(user.getId()).size();

        return UserProfileResponse.builder()
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .goalsCount(goalsCount)
                .transactionsCount(transactionsCount)
                .budgetsCount(budgetsCount)
                .budgetAlertEnabled(user.isBudgetAlertenabled())
                .goalProgressAlertEnabled(user.isGoalProgressAlertEnabled())
                .currency(user.getCurrency())
                .build();
    }

    /**
     * Builds the authenticated user's profile summary, including profile data and
     * aggregate counts for goals, transactions, and budgets.
     *
     * @param userDetails the authenticated principal
     * @return the profile response for the authenticated user
     */
    public UserProfileResponse getUserProfile(UserDetails userDetails) {
        User user = userService.getUser(userDetails);
        return toDTO(user);
    }

    /**
     * Updates editable profile fields for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @param request the requested profile changes
     * @return the updated profile response
     */
    public UserProfileResponse editUserProfile(UserDetails userDetails, UserProfileRequest request) {

        User user = userService.getUser(userDetails);
        if (request.getName() != null && !request.getName().isEmpty() && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        userService.saveUser(user);
        return toDTO(user);
    }
}
