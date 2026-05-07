package com.example.personal_budget.repository;
import com.example.personal_budget.entity.GoalEntity;
import com.example.personal_budget.enums.GoalStatus;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
  public interface GoalRepository extends JpaRepository<GoalEntity, Long> {
    List<GoalEntity> findByUserId(Long userId);
    Integer countByUserIdAndStatus(Long userId, GoalStatus ontrack);
}   