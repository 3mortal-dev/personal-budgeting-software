package com.example.personal_budget.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.personal_budget.dto.request.CreateCategoryRequest;
import com.example.personal_budget.dto.response.CategoryResponse;
import com.example.personal_budget.entity.Category;
import com.example.personal_budget.service.CategoryService;
import com.example.personal_budget.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final UserService userService;

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category);
    }

    private List<CategoryResponse> toResponseList(List<Category> categories) {
        return categories.stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(@AuthenticationPrincipal UserDetails userDetails) {
        List<CategoryResponse> categories = toResponseList(categoryService.getAllCategories(userService.getUserId(userDetails)));
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/built-in")
    public ResponseEntity<List<CategoryResponse>> getBuiltInCategories() {
        List<CategoryResponse> categories = toResponseList(categoryService.getBuiltInCategories());
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/custom")
    public ResponseEntity<List<CategoryResponse>> getCustomCategories(@AuthenticationPrincipal UserDetails userDetails) {
        List<CategoryResponse> categories = toResponseList(categoryService.getCustomCategories(userService.getUserId(userDetails)));
        return ResponseEntity.ok(categories);
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> addCustomCategory(@AuthenticationPrincipal UserDetails userDetails, @Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse category = toResponse(categoryService.addCustomCategory(userService.getUserId(userDetails), request));
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @PostMapping("/built-in")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> addBuiltInCategory(@Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse category = toResponse(categoryService.addBuiltInCategory(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @PutMapping("/{categoryID}")
    public ResponseEntity<CategoryResponse> editCustomCategory(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long categoryID, @Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse category = toResponse(categoryService.editCustomCategory(userService.getUserId(userDetails), categoryID, request));
        return ResponseEntity.ok(category);
    }

    @DeleteMapping ("/{categoryID}")
    public ResponseEntity<?> deleteCustomCategory(@AuthenticationPrincipal UserDetails userDetails,
                                                   @PathVariable Long categoryID) {
        categoryService.deleteCustomCategory(userService.getUserId(userDetails), categoryID);
        return ResponseEntity.noContent().build();
    }
}
