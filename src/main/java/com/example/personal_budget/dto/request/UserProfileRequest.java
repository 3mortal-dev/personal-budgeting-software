package com.example.personal_budget.dto.request;

import com.example.personal_budget.enums.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRequest {
    private String name;
    private String email;
    private Role role;

    private int transactionsCount;
    private int goalsCount;
    private int budgetsCount;
}
