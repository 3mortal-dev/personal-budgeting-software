package com.example.personal_budget.entity;

import com.example.personal_budget.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue
    Long id;

    //@ManyToOne
    //@JoinColumn(name = "user_id")
    Long userID;

    @Column(nullable = false)
    double amount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    TransactionType type;

    // @ManyToOne
    // @JoinColumn(name = "category_id")
    Long categoryID;

    @Column(nullable = false)
    LocalDate date;
    String source;
    String description;

}