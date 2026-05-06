package com.example.personal_budget.entity;

import java.io.ObjectInputFilter.Status;
import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import com.example.personal_budget.enums.GoalStatus;

@Entity
@Setter
@Getter
@Table(name = "goals")
public class GoalEntity {
    @Id
    @GeneratedValue
    private Long id;
    private Long userId;
    private String goalName;
    private double targetAmount;
    private LocalDate deadline;
    private Double currentAmount;
    @Enumerated(EnumType.STRING) 
    private GoalStatus status;
}
