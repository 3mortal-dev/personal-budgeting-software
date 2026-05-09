package com.example.personal_budget.dto.request.admin;

import com.example.personal_budget.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminUpdateUserRoleRequest {

    @NotNull(message = "Role is required")
    private Role role;
}
