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
import com.example.personal_budget.entity.User;
import com.example.personal_budget.service.CurrencyService;
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
    private final CurrencyService currencyService;

    /**
     * Returns aggregate counts used by the admin dashboard.
     *
     * @return system-wide user, transaction, budget, goal, and category counts
     */
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

    /**
     * Lists all users for administrative management.
     *
     * @return all users as admin response DTOs
     */
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        List<AdminUserResponse> users = StreamSupport.stream(userService.getAllUsers().spliterator(), false)
                .map(AdminUserResponse::new)
                .toList();
        return ResponseEntity.ok(users);
    }

    /**
     * Retrieves a single user for administrative management.
     *
     * @param id the user id
     * @return the matching user
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(new AdminUserResponse(userService.getUserById(id)));
    }

    /**
     * Updates a user's role, preventing admins from changing their own role.
     *
     * @param id the target user id
     * @param request the requested role change
     * @param userDetails the authenticated admin principal
     * @return the updated user
     */
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

    /**
     * Deletes a user account, preventing admins from deleting their own account.
     *
     * @param id the target user id
     * @param userDetails the authenticated admin principal
     * @return an empty no-content response
     */
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

    /**
     * Lists transactions owned by a specific user for admin review.
     *
     * @param id the target user id
     * @return the user's transactions
     */
    @GetMapping("/users/{id}/transactions")
    public ResponseEntity<List<TransactionResponse>> getUserTransactions(@PathVariable Long id) {
        User targetUser = userService.getUserById(id);
        List<TransactionResponse> transactions = transactionService.getAllTransactions(id)
                .stream()
                .map(t -> {
                    TransactionResponse tr = new TransactionResponse(t, targetUser.getCurrency());
                    tr.setAmount(currencyService.convert(t.getAmount(), t.getCurrency(), targetUser.getCurrency()));
                    return tr;
                })
                .toList();
        return ResponseEntity.ok(transactions);
    }
}
