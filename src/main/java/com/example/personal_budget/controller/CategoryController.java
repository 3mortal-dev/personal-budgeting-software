package com.example.personal_budget.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import com.example.personal_budget.service.CategoryService;
import com.example.personal_budget.service.UserService;
import com.example.personal_budget.dto.request.CreateCategoryRequest;
import com.example.personal_budget.entity.Category;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories(@AuthenticationPrincipal UserDetails userDetails) {
        List<Category> categories = categoryService.getAllCategories(userService.getUserID(userDetails));
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/built-in")
    public ResponseEntity<List<Category>> getBuiltInCategories() {
        List<Category> categories = categoryService.getBuiltInCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/custom")
    public ResponseEntity<List<Category>> getCustomCategories(@AuthenticationPrincipal UserDetails userDetails) {
        List<Category> categories = categoryService.getCustomCategories(userService.getUserID(userDetails));
        return ResponseEntity.ok(categories);
    }

    @PostMapping
    public ResponseEntity<Category> addCustomCategory(@AuthenticationPrincipal UserDetails userDetails, @Valid @RequestBody CreateCategoryRequest request) {
        Category category = categoryService.addCustomCategory(userService.getUserID(userDetails), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @PutMapping("/{categoryID}")
    public ResponseEntity<Category> editCustomCategory(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long categoryID, @Valid @RequestBody CreateCategoryRequest request) {
        Category category = categoryService.editCustomCategory(userService.getUserID(userDetails), categoryID, request);
        return ResponseEntity.ok(category);
    }

    @DeleteMapping("/{categoryID}")
    public ResponseEntity<?> deleteCustomCategory(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long categoryID) {
        categoryService.deleteCustomCategory(userService.getUserID(userDetails), categoryID);
        return ResponseEntity.noContent().build();
    }
}
