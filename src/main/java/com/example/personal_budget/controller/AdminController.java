package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.admin.AdminUpdateUserRoleRequest;
import com.example.personal_budget.dto.response.TransactionResponse;
import com.example.personal_budget.dto.response.admin.AdminStatsResponse;
import com.example.personal_budget.dto.response.admin.AdminUserResponse;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.Role;
import com.example.personal_budget.repository.BudgetRepository;
import com.example.personal_budget.repository.CategoryRepository;
import com.example.personal_budget.repository.GoalRepository;
import com.example.personal_budget.repository.TransactionRepository;
import com.example.personal_budget.repository.UserRepository;
import com.example.personal_budget.service.TransactionService;
import com.example.personal_budget.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.StreamSupport;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final TransactionService transactionService;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final GoalRepository goalRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(new AdminStatsResponse(
                userRepository.count(),
                userRepository.countByRole(Role.ADMIN),
                transactionRepository.count(),
                budgetRepository.count(),
                goalRepository.count(),
                categoryRepository.count()
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        List<AdminUserResponse> users = StreamSupport.stream(userService.getAllUsers().spliterator(), false)
                .map(AdminUserResponse::new)
                .toList();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(new AdminUserResponse(userService.getUserById(id)));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        long currentUserId = userService.getUserId(userDetails);
        if (currentUserId == id) {
            throw new RuntimeException("Admins cannot change their own role.");
        }
        User user = userService.getUserById(id);
        user.setRole(request.getRole());
        return ResponseEntity.ok(new AdminUserResponse(userService.saveUser(user)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        long currentUserId = userService.getUserId(userDetails);
        if (currentUserId == id) {
            throw new RuntimeException("Admins cannot delete their own account.");
        }
        userService.deleteUserById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{id}/transactions")
    public ResponseEntity<List<TransactionResponse>> getUserTransactions(@PathVariable Long id) {
        userService.getUserById(id);
        List<TransactionResponse> transactions = transactionService.getAllTransactions(id)
                .stream()
                .map(TransactionResponse::new)
                .toList();
        return ResponseEntity.ok(transactions);
    }
}
