package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.GoalRequest;
import com.example.personal_budget.entity.Goal;
import com.example.personal_budget.service.GoalService;
import com.example.personal_budget.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RequiredArgsConstructor
@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Goal> addGoal(
            @RequestBody GoalRequest goalRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(goalService.addGoal(goalRequest, userId));
    }


    @PutMapping("/{id}")
    public ResponseEntity<Goal> editGoal(
            @PathVariable Long id,
            @RequestBody GoalRequest goalRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(goalService.editGoal(id, goalRequest, userId));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<Goal> updateProgress(
            @PathVariable long id,
            @RequestParam double amount,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(goalService.updateProgress(id, amount, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteGoal(
            @PathVariable long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        long userId = userService.getUserId(userDetails);
        goalService.deleteGoal(id, userId);
        return ResponseEntity.ok("Goal deleted");
    }

    @GetMapping("/user")
    public ResponseEntity<List<Goal>> getUserGoals(@AuthenticationPrincipal UserDetails userDetails) {
        long userId = getUserId(userDetails);
        return ResponseEntity.ok(goalService.getGoalsByUserId(userId));
    }

    private long getUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new RuntimeException("User not authenticated");
        }

        return userService.getUserId(userDetails);
    }


}

