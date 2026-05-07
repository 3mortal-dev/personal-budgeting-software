package com.example.personal_budget.service;

import com.example.personal_budget.dto.request.CreateCategoryRequest;
import com.example.personal_budget.entity.Category;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.CategoryType;
import com.example.personal_budget.repository.CategoryRepository;
import com.example.personal_budget.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public Category getById (Long categoryId) {
        return categoryRepository.findById(categoryId).orElseThrow(
                () -> new RuntimeException("Category with id " + categoryId + "not found"));
    }

    public List<Category> getAllCategories (Long userID) {
        return categoryRepository.findByUserIdOrType(userID, CategoryType.BUILT_IN);
    }

    public List<Category> getBuiltInCategories () {
        return categoryRepository.findByType(CategoryType.BUILT_IN);
    }

    public List<Category> getCustomCategories (Long userID) {
        return categoryRepository.findByUserId(userID);
    }

    public Category addCustomCategory (Long userID, CreateCategoryRequest request) {

        User user = userRepository.findById(userID).orElseThrow(() -> new RuntimeException("User not found"));

        Category category = Category.builder().user(user).name(request.getName()).type(request.getType()).build();

        return categoryRepository.save(category);
    }

    public Category editCustomCategory (Long userID, Long categoryID, CreateCategoryRequest request) {

        Category category = categoryRepository.findByIdAndUserId(categoryID, userID).orElseThrow(
                () -> new RuntimeException("Category not found"));

        category.setName(request.getName());
        category.setType(request.getType());

        return categoryRepository.save(category);
    }

    public void deleteCustomCategory (Long userID, Long categoryID) {

        Category category = categoryRepository.findByIdAndUserId(categoryID, userID).orElseThrow(
                () -> new RuntimeException("Category not found"));

        categoryRepository.delete(category);
    }
}
