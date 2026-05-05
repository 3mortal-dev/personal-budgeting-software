package com.example.personal_budget.repository;
import com.example.personal_budget.entity.GoalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
  public interface GoalRepository extends JpaRepository<GoalEntity, Long> {
}   