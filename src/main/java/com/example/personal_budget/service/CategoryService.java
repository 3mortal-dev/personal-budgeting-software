package com.example.personal_budget.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.personal_budget.dto.request.CreateCategoryRequest;
import com.example.personal_budget.entity.Category;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.CategoryType;
import com.example.personal_budget.repository.CategoryRepository;
import com.example.personal_budget.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<Category> getAllCategories(Long userID) {
        return categoryRepository.findByUserIdOrType(userID, CategoryType.BUILT_IN);
    }

    public List<Category> getBuiltInCategories() {
        return categoryRepository.findByType(CategoryType.BUILT_IN);
    }

    public List<Category> getCustomCategories(Long userID) {
        return categoryRepository.findByUserId(userID);
    }

    public Category getCategoryById(Long userID, Long categoryID) {
        return categoryRepository.findAccessibleCategory(categoryID, userID)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    public Category addCustomCategory(Long userID, CreateCategoryRequest request) {

        User user = userRepository.findById(userID).orElseThrow(() -> new RuntimeException("User not found"));
        String normalizedName = normalizeName(request.getName());

        ensureNotBuiltInName(normalizedName);
        ensureUniqueForUser(userID, normalizedName, null);

        Category category = Category.builder()
                .user(user)
                .name(normalizedName)
                .type(CategoryType.CUSTOM)
                .build();

        return categoryRepository.save(category);
    }

    public Category editCustomCategory(Long userID, Long categoryID, CreateCategoryRequest request) {

        Category category = categoryRepository.findByIdAndUserId(categoryID, userID).orElseThrow(
                () -> new RuntimeException("Category not found"));

        if (category.getType() != CategoryType.CUSTOM) {
            throw new RuntimeException("Only custom categories can be edited by users");
        }

        String normalizedName = normalizeName(request.getName());
        ensureNotBuiltInName(normalizedName);
        ensureUniqueForUser(userID, normalizedName, categoryID);

        category.setName(normalizedName);
        category.setType(CategoryType.CUSTOM);

        return categoryRepository.save(category);
    }

    public void deleteCustomCategory(Long userID, Long categoryID) {

        Category category = categoryRepository.findByIdAndUserId(categoryID, userID).orElseThrow(
                () -> new RuntimeException("Category not found"));
        if (category.getType() != CategoryType.CUSTOM) {
            throw new RuntimeException("Only custom categories can be deleted by users");
        }

        categoryRepository.delete(category);
    }

    public Category addBuiltInCategory(CreateCategoryRequest request) {
        String normalizedName = normalizeName(request.getName());

        if (categoryRepository.existsByTypeAndNameIgnoreCase(CategoryType.BUILT_IN, normalizedName)) {
            throw new RuntimeException("Built-in category already exists");
        }

        Category category = Category.builder()
                .user(null)
                .name(normalizedName)
                .type(CategoryType.BUILT_IN)
                .build();

        return categoryRepository.save(category);
    }

    private String normalizeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Category name is required");
        }
        return name.trim();
    }

    private void ensureNotBuiltInName(String name) {
        if (categoryRepository.existsByTypeAndNameIgnoreCase(CategoryType.BUILT_IN, name)) {
            throw new RuntimeException("Custom category name cannot match an existing built-in category");
        }
    }

    private void ensureUniqueForUser(Long userId, String name, Long currentCategoryId) {
        List<Category> userCategories = categoryRepository.findByUserId(userId);
        boolean duplicate = userCategories.stream()
                .anyMatch(c -> c.getName() != null
                        && c.getName().equalsIgnoreCase(name)
                        && (currentCategoryId == null || !c.getId().equals(currentCategoryId)));
        if (duplicate) {
            throw new RuntimeException("Category name already exists in your custom categories");
        }
    }
}
