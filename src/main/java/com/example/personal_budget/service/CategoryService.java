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

    /**
     * Retrieves all categories available to a user, including built-in categories.
     *
     * @param userID the user id
     * @return accessible categories for the user
     */
    public List<Category> getAllCategories(Long userID) {
        return categoryRepository.findByUserIdOrType(userID, CategoryType.BUILT_IN);
    }

    /**
     * Retrieves built-in categories shared by all users.
     *
     * @return built-in categories
     */
    public List<Category> getBuiltInCategories() {
        return categoryRepository.findByType(CategoryType.BUILT_IN);
    }

    /**
     * Retrieves custom categories owned by a user.
     *
     * @param userID the owner user id
     * @return custom categories for the user
     */
    public List<Category> getCustomCategories(Long userID) {
        return categoryRepository.findByUserId(userID);
    }

    /**
     * Loads a category that is either owned by the user or globally built in.
     *
     * @param userID the requesting user id
     * @param categoryID the category id
     * @return the accessible category
     */
    public Category getCategoryById(Long userID, Long categoryID) {
        return categoryRepository.findAccessibleCategory(categoryID, userID)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    /**
     * Creates a custom category for a user after validating name uniqueness.
     *
     * @param userID the owner user id
     * @param request the category creation details
     * @return the saved custom category
     */
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

    /**
     * Updates a custom category owned by a user.
     *
     * @param userID the owner user id
     * @param categoryID the category to update
     * @param request the requested category changes
     * @return the updated category
     */
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

    /**
     * Deletes a custom category owned by a user.
     *
     * @param userID the owner user id
     * @param categoryID the category to delete
     */
    public void deleteCustomCategory(Long userID, Long categoryID) {

        Category category = categoryRepository.findByIdAndUserId(categoryID, userID).orElseThrow(
                () -> new RuntimeException("Category not found"));
        if (category.getType() != CategoryType.CUSTOM) {
            throw new RuntimeException("Only custom categories can be deleted by users");
        }

        categoryRepository.delete(category);
    }

    /**
     * Creates a built-in category available to all users.
     *
     * @param request the category creation details
     * @return the saved built-in category
     */
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
