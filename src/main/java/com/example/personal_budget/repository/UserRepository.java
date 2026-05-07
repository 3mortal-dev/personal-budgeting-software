package com.example.personal_budget.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.personal_budget.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @Query("SELECT u.id FROM User u WHERE u.email = :email")
    Optional<Long> findIdByEmail(@Param("email") String email);

    @Modifying
    @Query("UPDATE User u SET u.budgetAlertenabled = :budgetAlertEnabled, u.goalProgressAlertEnabled = :goalProgressAlertEnabled WHERE u.id = :id")
    void updateNotificationSettingsById(@Param("id") Long id, @Param("budgetAlertEnabled") boolean budgetAlertEnabled, @Param("goalProgressAlertEnabled") boolean goalProgressAlertEnabled);

}
