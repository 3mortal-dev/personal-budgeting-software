package com.example.personal_budget.dto.response;

import com.example.personal_budget.entity.Budget;
import com.example.personal_budget.enums.BudgetStatus;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class BudgetResponse {
	
	private final Long id;
	private final Long userId;
	private final Long categoryId;
	private final String categoryName;
	private final Double spendingLimit;
	private final Double spentAmount;
	private final Double threshold;
	private final LocalDate startDate;
	private final LocalDate endDate;
	private final BudgetStatus status;

	public BudgetResponse(Budget budget) {
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
	}
}
