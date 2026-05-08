package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.GoalRequest;
import com.example.personal_budget.dto.response.GoalResponse;
import com.example.personal_budget.service.GoalService;
import com.example.personal_budget.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.rmi.dgc.VMID;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<GoalResponse> addGoal(
            @RequestBody GoalRequest goalRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(new GoalResponse(goalService.addGoal(goalRequest, userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> editGoal(
            @PathVariable Long id,
            @RequestBody GoalRequest goalRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(new GoalResponse(goalService.editGoal(id, goalRequest, userId)));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<GoalResponse> updateProgress(
            @PathVariable long id,
            @RequestParam double amount,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(new GoalResponse(goalService.updateProgress(id, amount, userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        goalService.deleteGoal(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user")
    public ResponseEntity<List<GoalResponse>> getUserGoals(
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(
                goalService.getGoalsByUserId(userId)
                        .stream()
                        .map(GoalResponse::new)
                        .toList()
        );
    }
}
