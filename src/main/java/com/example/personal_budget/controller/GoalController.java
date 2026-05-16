package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.GoalRequest;
import com.example.personal_budget.dto.response.GoalResponse;
import com.example.personal_budget.service.GoalService;
import com.example.personal_budget.service.UserService;

import jakarta.validation.Valid;
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

    /**
     * Creates a goal for the authenticated user.
     *
     * @param goalRequest the goal details
     * @param userDetails the authenticated principal
     * @return the created goal
     */
    @PostMapping
    public ResponseEntity<GoalResponse> addGoal(
          @Valid @RequestBody GoalRequest goalRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(new GoalResponse(goalService.addGoal(goalRequest, userId)));
    }

    /**
     * Updates a goal owned by the authenticated user.
     *
     * @param id the goal id
     * @param goalRequest the replacement goal details
     * @param userDetails the authenticated principal
     * @return the updated goal
     */
    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> editGoal(
            @PathVariable Long id,
            @Valid @RequestBody GoalRequest goalRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(new GoalResponse(goalService.editGoal(id, goalRequest, userId)));
    }

    /**
     * Updates the saved progress amount for a goal.
     *
     * @param id the goal id
     * @param amount the new saved amount
     * @param userDetails the authenticated principal
     * @return the updated goal
     */
    @PatchMapping("/{id}/progress")
    public ResponseEntity<GoalResponse> updateProgress(
            @PathVariable long id,
            @RequestParam double amount,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(new GoalResponse(goalService.updateProgress(id, amount, userId)));
    }

    /**
     * Deletes a goal owned by the authenticated user.
     *
     * @param id the goal id
     * @param userDetails the authenticated principal
     * @return an empty no-content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        goalService.deleteGoal(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lists goals owned by the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @return the user's goals
     */
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
