package com.example.personal_budget.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "exchange_rates",
       uniqueConstraints = @UniqueConstraint(columnNames = {"from_currency", "to_currency"}))
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_currency", nullable = false, length = 3)
    private String fromCurrency;

    @Column(name = "to_currency", nullable = false, length = 3)
    private String toCurrency;

    @Column(nullable = false)
    private Double rate;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
