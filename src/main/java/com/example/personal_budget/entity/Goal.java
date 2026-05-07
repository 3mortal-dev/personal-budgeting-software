package com.example.personal_budget.entity;

import com.example.personal_budget.enums.GoalStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Setter
@Getter
@Table(name = "goals")
public class Goal {
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
