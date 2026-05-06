package com.example.personal_budget.dto.request;

import com.example.personal_budget.enums.Role;

import lombok.Getter;
import lombok.Setter;


@Setter
@Getter
public class UserProfileRequest {
    private String name;
    private String email;
    Role role ;
}
