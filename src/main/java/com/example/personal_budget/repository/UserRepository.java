package com.example.personal_budget.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.Role;

public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * Finds a user by email address.
     *
     * @param email the email address
     * @return the matching user when present
     */
    Optional<User> findByEmail(String email);

    /**
     * Counts users with the supplied role.
     *
     * @param role the role to count
     * @return the number of users with that role
     */
    long countByRole(Role role);

    /**
     * Finds a user's id by email address.
     *
     * @param email the email address
     * @return the matching user id when present
     */
    @Query("SELECT u.id FROM User u WHERE u.email = :email")
    Optional<Long> findIdByEmail(@Param("email") String email);

    /**
     * Updates notification preferences for a user.
     *
     * @param id the user id
     * @param budgetAlertEnabled whether budget alerts are enabled
     * @param goalProgressAlertEnabled whether goal progress alerts are enabled
     */
    @Modifying
    @Query("UPDATE User u SET u.budgetAlertenabled = :budgetAlertEnabled, u.goalProgressAlertEnabled = :goalProgressAlertEnabled WHERE u.id = :id")
    void updateNotificationSettingsById(@Param("id") Long id, @Param("budgetAlertEnabled") boolean budgetAlertEnabled, @Param("goalProgressAlertEnabled") boolean goalProgressAlertEnabled);

}
