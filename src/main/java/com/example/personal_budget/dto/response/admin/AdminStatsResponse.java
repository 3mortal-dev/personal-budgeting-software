package com.example.personal_budget.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminStatsResponse {

    private final long users;
    private final long admins;
    private final long transactions;
    private final long budgets;
    private final long goals;
    private final long categories;
}
