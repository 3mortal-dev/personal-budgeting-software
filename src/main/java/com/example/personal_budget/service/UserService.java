package com.example.personal_budget.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.example.personal_budget.dto.request.UpdateNotificationSettings;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private Long getUserIdByEmail(String email) {
        return userRepository.findIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public boolean userExistsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    // get userid from userdetails
    public long getUserId(UserDetails userDetails) {
        String username = userDetails.getUsername();
        return getUserIdByEmail(username);
    }

    // get userid from userdetails
    public User getUser(UserDetails userDetails) {
        String username = userDetails.getUsername();
        return getUserByEmail(username);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public Iterable<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUserById(Long id) {
        userRepository.deleteById(id);
    }

    public void updateNotificationSettings(UpdateNotificationSettings request, long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        userRepository.updateNotificationSettingsById(userId, request.isBudgetAlerts(), request.isGoalReminders());
    }

    
}
