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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String goalName;

    private double targetAmount;

    private LocalDate deadline;

    private Double currentAmount;

    @Enumerated(EnumType.STRING)
    private GoalStatus status;

    @Column(name = "icon_class")
    private String iconClass;

    @Column(name = "icon_color")
    private String iconColor;

    public double getCurrentAmount() {
        return this.currentAmount != null ? this.currentAmount : 0.0;
    }
}