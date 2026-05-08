package com.example.personal_budget.dto.response;

import com.example.personal_budget.entity.Category;
import com.example.personal_budget.enums.CategoryType;
import lombok.Getter;

@Getter
public class CategoryResponse {

    private final Long id;
    private final Long userId;
    private final CategoryType type;
    private final String name;

    public CategoryResponse(Category category) {
        this.id = category.getId();
        this.userId = (category.getUser() != null ? category.getUser().getId() : null);
        this.type = category.getType();
        this.name = category.getName();
    }
}
