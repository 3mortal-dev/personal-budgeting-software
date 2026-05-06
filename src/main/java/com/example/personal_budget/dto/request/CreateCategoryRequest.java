package com.example.personal_budget.dto.request;

import com.example.personal_budget.enums.CategoryType;

import lombok.Data;

@Data
public class CreateCategoryRequest {

    private CategoryType type;
    private String name;
}
