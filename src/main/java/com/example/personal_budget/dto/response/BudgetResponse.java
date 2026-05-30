package com.example.personal_budget.dto.response;

import com.example.personal_budget.entity.Budget;
import com.example.personal_budget.enums.BudgetStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BudgetResponse {

	private Long id;
	private Long userId;
	private Long categoryId;
	private String categoryName;
	private Double spendingLimit;
	private Double spentAmount;
	private Double threshold;
	private LocalDate startDate;
	private LocalDate endDate;
	private BudgetStatus status;
	private String currency;

	public BudgetResponse() {}

	public BudgetResponse(Budget budget, String currency) {
		this.id = budget.getId();
		this.userId = budget.getUser().getId();
		this.categoryId = budget.getCategory().getId();
		this.categoryName = budget.getCategory().getName();
		this.spendingLimit = budget.getSpendingLimit();
		this.spentAmount = budget.getSpentAmount();
		this.threshold = budget.getThreshold();
		this.startDate = budget.getStartDate();
		this.endDate = budget.getEndDate();
		this.status = budget.getStatus();
		this.currency = currency;
	}

	public BudgetResponse(Budget budget) {
		this(budget, "USD");
	}
}
