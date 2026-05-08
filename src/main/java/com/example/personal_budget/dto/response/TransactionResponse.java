package com.example.personal_budget.dto.response;

import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class TransactionResponse {

    private final Long id;
    private final Long userId;
    private final Long categoryId;
    private final double amount;
    private final TransactionType type;
    private final LocalDate date;
    private final String source;
    private final String description;

    public TransactionResponse(Transaction t) {
        this.id = t.getId();
        this.userId = t.getUser().getId();
        // TransactionResponse.java
        this.categoryId = t.getCategory() != null ? t.getCategory().getId() : null;
        this.amount = t.getAmount();
        this.type = t.getType();
        this.date = t.getDate();
        this.source = t.getSource();
        this.description = t.getDescription();
    }
}