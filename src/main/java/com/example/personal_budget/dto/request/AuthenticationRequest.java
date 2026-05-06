package com.example.personal_budget.dto.request;

public record AuthenticationRequest(
    String email,
    String password
) {
}
