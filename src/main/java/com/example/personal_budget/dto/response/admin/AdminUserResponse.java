package com.example.personal_budget.dto.response.admin;

import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.Role;
import lombok.Getter;

@Getter
public class AdminUserResponse {

    private final Long id;
    private final String name;
    private final String email;
    private final Role role;
    private final boolean budgetAlertEnabled;
    private final boolean goalProgressAlertEnabled;

    public AdminUserResponse(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.budgetAlertEnabled = user.isBudgetAlertenabled();
        this.goalProgressAlertEnabled = user.isGoalProgressAlertEnabled();
    }
}
