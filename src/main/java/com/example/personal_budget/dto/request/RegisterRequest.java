package com.example.personal_budget.dto.request;

public record RegisterRequest(
    String name,
    String email,
    String password
) {
}
