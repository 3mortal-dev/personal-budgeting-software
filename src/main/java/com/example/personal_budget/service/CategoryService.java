package com.example.personal_budget.service;

import org.springframework.stereotype.Service;

import com.example.personal_budget.repository.CategoryRepository;
import com.example.personal_budget.repository.UserRepository;
import com.example.personal_budget.entity.Category;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.CategoryType;
import com.example.personal_budget.dto.request.CreateCategoryRequest;
import com.example.personal_budget.dto.response.CategoryResponse;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category);
    }

    private List<CategoryResponse> toResponseList(List<Category> categories) {
        return categories.stream()
                .map(this::toResponse)
                .toList();
    }

    public List<CategoryResponse> getAllCategories(Long userID) {
        return toResponseList(categoryRepository.findByUserIdOrType(userID, CategoryType.BUILT_IN));
    }

    public List<CategoryResponse> getBuiltInCategories() {
        return toResponseList(categoryRepository.findByType(CategoryType.BUILT_IN));
    }

    public List<CategoryResponse> getCustomCategories(Long userID) {
        return toResponseList(categoryRepository.findByUserId(userID));
    }

    public CategoryResponse getCategoryById(Long userID, Long categoryID) {
        return toResponse(categoryRepository.findByIdAndUserId(categoryID, userID)
                .orElseThrow(() -> new RuntimeException("Category not found")));
    }

    public CategoryResponse addCustomCategory(Long userID, CreateCategoryRequest request) {

        User user = userRepository.findById(userID)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = Category.builder()
                .user(user)
                .name(request.getName())
                .type(request.getType())
                .build();

        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse editCustomCategory(Long userID, Long categoryID, CreateCategoryRequest request) {

        Category category = categoryRepository.findByIdAndUserId(categoryID, userID)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        category.setName(request.getName());
        category.setType(request.getType());

        return toResponse(categoryRepository.save(category));
    }

    public void deleteCustomCategory(Long userID, Long categoryID) {

        Category category = categoryRepository.findByIdAndUserId(categoryID, userID)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        categoryRepository.delete(category);
    }
}
