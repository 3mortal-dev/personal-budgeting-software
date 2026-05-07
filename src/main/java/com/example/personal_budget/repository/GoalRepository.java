package com.example.personal_budget.repository;
import com.example.personal_budget.entity.GoalEntity;
import com.example.personal_budget.enums.GoalStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
  public interface GoalRepository extends JpaRepository<GoalEntity, Long> {
    List<GoalEntity> findByUserId(Long userId);
    Integer countByUserIdAndStatus(Long userId, GoalStatus ontrack);
}   