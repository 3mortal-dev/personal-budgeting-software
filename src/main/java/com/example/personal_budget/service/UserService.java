package com.example.personal_budget.service;

import com.example.personal_budget.dto.request.UpdateNotificationSettings;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private Long getUserIdByEmail(String email) {
        return userRepository.findIdByEmail(email).orElseThrow(
                () -> new RuntimeException("User not found with email: " + email));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(
                () -> new RuntimeException("User not found with email: " + email));
    }

    /**
     * Checks whether a user account already exists for the supplied email.
     *
     * @param email the email address to search for
     * @return {@code true} when a matching user exists, otherwise {@code false}
     */
    public boolean userExistsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    /**
     * Resolves the authenticated user's database id from Spring Security details.
     *
     * @param userDetails the authenticated principal
     * @return the user's database id
     */
    public long getUserId(UserDetails userDetails) {
        String username = userDetails.getUsername();
        return getUserIdByEmail(username);
    }

    /**
     * Loads the authenticated user entity represented by Spring Security details.
     *
     * @param userDetails the authenticated principal
     * @return the matching user entity
     */
    public User getUser(UserDetails userDetails) {
        String username = userDetails.getUsername();
        return getUserByEmail(username);
    }

    /**
     * Loads a user by id.
     *
     * @param id the user id
     * @return the matching user entity
     */
    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    /**
     * Retrieves every user in the system.
     *
     * @return all stored user entities
     */
    public Iterable<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Persists a user entity.
     *
     * @param user the user entity to save
     * @return the saved user entity
     */
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    /**
     * Deletes a user account by id.
     *
     * @param id the id of the user to delete
     */
    public void deleteUserById(Long id) {
        userRepository.deleteById(id);
    }

    /**
     * Updates the user's notification preferences.
     *
     * @param request the requested budget alert and goal reminder settings
     * @param userId the user whose settings should be updated
     */
    @Transactional
    public void updateNotificationSettings(
            UpdateNotificationSettings request,
            long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        userRepository.updateNotificationSettingsById(userId, request.isBudgetAlerts(), request.isGoalReminders());
    }

}
