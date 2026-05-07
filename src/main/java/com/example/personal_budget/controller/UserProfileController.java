package com.example.personal_budget.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.personal_budget.dto.request.UserProfileRequest;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.service.UserProfileService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;



@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;
    
    @GetMapping
    public ResponseEntity<UserProfileRequest>getUserProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getUserProfile(userDetails));
    }

    @PutMapping
    public ResponseEntity<UserProfileRequest> editUserProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(userProfileService.editUserProfile(userDetails, request));
    }
}
