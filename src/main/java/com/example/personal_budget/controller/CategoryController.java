package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.CreateCategoryRequest;
import com.example.personal_budget.entity.Category;
import com.example.personal_budget.service.CategoryService;
import com.example.personal_budget.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping ("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories (@AuthenticationPrincipal UserDetails userDetails) {
        List<Category> categories = categoryService.getAllCategories(userService.getUserId(userDetails));
        return ResponseEntity.ok(categories);
    }

    @GetMapping ("/built-in")
    public ResponseEntity<List<Category>> getBuiltInCategories () {
        List<Category> categories = categoryService.getBuiltInCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping ("/custom")
    public ResponseEntity<List<Category>> getCustomCategories (@AuthenticationPrincipal UserDetails userDetails) {
        List<Category> categories = categoryService.getCustomCategories(userService.getUserId(userDetails));
        return ResponseEntity.ok(categories);
    }

    @PostMapping
    public ResponseEntity<Category> addCustomCategory (@AuthenticationPrincipal UserDetails userDetails,
                                                       @Valid @RequestBody CreateCategoryRequest request) {
        Category category = categoryService.addCustomCategory(userService.getUserId(userDetails), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @PutMapping ("/{categoryID}")
    public ResponseEntity<Category> editCustomCategory (@AuthenticationPrincipal UserDetails userDetails,
                                                        @PathVariable Long categoryID,
                                                        @Valid @RequestBody CreateCategoryRequest request) {
        Category category = categoryService.editCustomCategory(userService.getUserId(userDetails), categoryID, request);
        return ResponseEntity.ok(category);
    }

    @DeleteMapping ("/{categoryID}")
    public ResponseEntity<?> deleteCustomCategory (@AuthenticationPrincipal UserDetails userDetails,
                                                   @PathVariable Long categoryID) {
        categoryService.deleteCustomCategory(userService.getUserId(userDetails), categoryID);
        return ResponseEntity.noContent().build();
    }
}
