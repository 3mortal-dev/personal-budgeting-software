package com.example.personal_budget.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.example.personal_budget.dto.request.UserProfileRequest;
import com.example.personal_budget.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import com.example.personal_budget.entity.User;

@RequiredArgsConstructor
@Service
public class UserProfileService {

    private final UserService userService;
    private final GoalService goalService;
    private final TransactionService transactionService;

    private UserProfileRequest toDTO(User user) {

        int goalsCount = goalService.getGoalsByUserId(user.getId()).size();
        int transactionsCount = transactionService.getAllTransactions(user.getId()).size();

        return UserProfileRequest.builder()
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .goalsCount(goalsCount)
                .transactionsCount(transactionsCount)
                .build();
    }

    public UserProfileRequest getUserProfile(UserDetails userDetails) {
        User user = userService.getUser(userDetails);
        return toDTO(user);
    }

    public UserProfileRequest editUserProfile(UserDetails userDetails, UserProfileRequest request) {

        User user = userService.getUser(userDetails);
        if (request.getName() != null && !request.getName().isEmpty() && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        userService.saveUser(user);
        return toDTO(user);
    }
}
