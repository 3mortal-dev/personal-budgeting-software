package com.example.personal_budget.entity;

import com.example.personal_budget.enums.GoalStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder.Default;

import java.time.LocalDate;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "goals")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(nullable = false)
    private String goalName;

    @Column(nullable = false)
    private double targetAmount;

    @Column(nullable = false)
    private LocalDate deadline;

    @Column(nullable = false)
	@Default
    private Double currentAmount = 0.0;

    @Enumerated(EnumType.STRING)
    private GoalStatus status;

    @Column(name = "icon_class")
    private String iconClass;

    @Column(name = "icon_color")
    private String iconColor;
}
