package com.example.personal_budget.controller;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;

import com.example.personal_budget.service.UserService;

@RestController
public class GoalController {

    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    private UserService userService;
    long id = userService.getUserIdByEmail(username);   

}
