package com.example.personal_budget.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.personal_budget.dto.request.GoalRequest;
import com.example.personal_budget.entity.GoalEntity;
import com.example.personal_budget.service.GoalService;
import com.example.personal_budget.service.UserService;
import java.util.List;

import jakarta.websocket.server.PathParam;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;



@RequiredArgsConstructor
@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<GoalEntity> addGoal(@RequestBody GoalRequest goalRequest , @AuthenticationPrincipal UserDetails userDetails) 
    {
        long userId = userService.getUserId(userDetails) ; 
        return ResponseEntity.ok(goalService.addGoal(goalRequest, userId));
    }


    @PutMapping("/{id}") 
    public ResponseEntity<GoalEntity> editGoal(@PathVariable Long id, @RequestBody GoalRequest goalRequest , @AuthenticationPrincipal UserDetails userDetails) 
    {
        long userId = userService.getUserId(userDetails) ; 
        return ResponseEntity.ok(goalService.editGoal(id, goalRequest, userId));
    }

   @PatchMapping("/{id}/progress")
    public ResponseEntity<GoalEntity> updateProgress(@PathVariable long id,@RequestParam double amount,@AuthenticationPrincipal UserDetails userDetails) 
    {
        long userId = userService.getUserId(userDetails);
        return ResponseEntity.ok(goalService.updateProgress(id, amount, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteGoal( @PathVariable long id,@AuthenticationPrincipal UserDetails userDetails) {

        long userId = userService.getUserId(userDetails);
        goalService.deleteGoal(id, userId);
        return ResponseEntity.ok("Goal deleted");
    }

    @GetMapping("/user")
    public ResponseEntity<List<GoalEntity>> getUserGoals(@AuthenticationPrincipal UserDetails userDetails) {
        long userId = userService.getUserId(userDetails);
        List<GoalEntity> goals = goalService.getGoalsByUserId(userId);
        return ResponseEntity.ok(goals);
    }
}

