package com.example.personal_budget.dto.response;

import com.example.personal_budget.entity.Transaction;
import com.example.personal_budget.enums.TransactionType;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TransactionResponse {

    private Long id;
    private Long userId;
    private Long categoryId;
    private String categoryName;
    private double amount;
    private TransactionType type;
    private LocalDate date;
    private String source;
    private String description;
    private String currency;

    public TransactionResponse() {}

    public TransactionResponse(Transaction t, String displayCurrency) {
        this.id = t.getId();
        this.userId = t.getUser().getId();
        this.categoryId = t.getCategory() != null ? t.getCategory().getId() : null;
        this.categoryName = t.getCategory() != null ? t.getCategory().getName() : null;
        this.amount = t.getAmount();
        this.type = t.getType();
        this.date = t.getDate();
        this.source = t.getSource();
        this.description = t.getDescription();
        this.currency = displayCurrency;
    }

    public TransactionResponse(Transaction t) {
        this(t, t.getCurrency());
    }
}
