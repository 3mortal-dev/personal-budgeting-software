package com.example.personal_budget.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.personal_budget.dto.request.UpdateNotificationSettings;
import com.example.personal_budget.dto.request.UserProfileRequest;
import com.example.personal_budget.dto.response.UserProfileResponse;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.service.UserProfileService;
import com.example.personal_budget.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;



@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final UserService userService ;
    
    /**
     * Returns the authenticated user's profile.
     *
     * @param userDetails the authenticated principal
     * @return the profile response
     */
    @GetMapping
    public ResponseEntity<UserProfileResponse>getUserProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getUserProfile(userDetails));
    }

    /**
     * Updates the authenticated user's profile.
     *
     * @param userDetails the authenticated principal
     * @param request the requested profile changes
     * @return the updated profile response
     */
    @PutMapping
    public ResponseEntity<UserProfileResponse> editUserProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(userProfileService.editUserProfile(userDetails, request));
    }

    /**
     * Updates notification settings for the authenticated user.
     *
     * @param userDetails the authenticated principal
     * @param request the requested notification preferences
     * @return an empty no-content response
     */
    @PutMapping("/notifications")
    public ResponseEntity<Void> updateNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateNotificationSettings request) {
        long userId = userService.getUserId(userDetails);
        userService.updateNotificationSettings(request, userId);
        return ResponseEntity.noContent().build();
    }
}
