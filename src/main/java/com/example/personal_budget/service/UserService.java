package com.example.personal_budget.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.personal_budget.entity.User;
import com.example.personal_budget.repository.UserRepository;

@Service
public class userService {

    @Autowired
    private UserRepository userRepository;

    
    public userService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Long getUserIdByEmail(String email) {
        return userRepository.findIdByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public boolean userExistsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    public Iterable<User> getAllUsers() {
        return userRepository.findAll();
    }

    
}
