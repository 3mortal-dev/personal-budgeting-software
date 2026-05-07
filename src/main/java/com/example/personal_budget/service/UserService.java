package com.example.personal_budget.service;

import com.example.personal_budget.entity.User;
import com.example.personal_budget.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {


    private final UserRepository userRepository;

    private Long getUserIdByEmail (String email) {
        return userRepository.findIdByEmail(email).orElseThrow(
                () -> new RuntimeException("User not found with email: " + email));
    }

    private User getUserByEmail (String email) {
        return userRepository.findByEmail(email).orElseThrow(
                () -> new RuntimeException("User not found with email: " + email));
    }

    public boolean userExistsByEmail (String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    // get userid from userdetails
    public long getUserId (UserDetails userDetails) {
        String username = userDetails.getUsername();
        return getUserIdByEmail(username);
    }

    // get user from userdetails
    public User getUser (UserDetails userDetails) {
        String username = userDetails.getUsername();
        return getUserByEmail(username);
    }

    // get user by userId
    public User getUser (Long userId) {
        return userRepository.findById(userId).orElseThrow(
                () -> new RuntimeException("User with id " + userId + "not found"));
    }

    public Iterable<User> getAllUsers () {
        return userRepository.findAll();
    }

    public void deleteUserById (Long id) {
        userRepository.deleteById(id);
    }


}
