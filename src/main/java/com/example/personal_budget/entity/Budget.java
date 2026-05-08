package com.example.personal_budget.entity;

import com.example.personal_budget.enums.BudgetStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.Builder.Default;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "budgets", uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "category_id"})})
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Category category;

    @Column(nullable = false)
    private Double spendingLimit;

    @Column(nullable = false)
    @Default
    private Double spentAmount = 0.0;

    @Column(nullable = false)
    @Min(value = 0, message = "Threshold cannot be less than 0")
    @Max(value = 100, message = "Threshold cannot be more than 100")
    private Double threshold;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private BudgetStatus status;
}
