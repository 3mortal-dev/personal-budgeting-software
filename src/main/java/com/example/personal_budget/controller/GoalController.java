package com.example.personal_budget.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.personal_budget.dto.request.GoalRequest;
import com.example.personal_budget.entity.GoalEntity;
import com.example.personal_budget.service.GoalService;
import com.example.personal_budget.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RequiredArgsConstructor
@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;
    private final UserService userService;

 @PostMapping
public GoalEntity addGoal(
        @RequestBody GoalRequest request,
        @AuthenticationPrincipal UserDetails userDetails) {

    String username = userDetails.getUsername();

    return goalService.addGoal(request, username);
}
}
