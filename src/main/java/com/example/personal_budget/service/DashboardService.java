// package com.example.personal_budget.service;
// <<<<<<< HEAD
// import org.springframework.data.repository.core.support.TransactionalRepositoryFactoryBeanSupport;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.stereotype.Service;

// import com.example.personal_budget.entity.Transaction;
// import com.example.personal_budget.entity.User;
// import com.example.personal_budget.repository.UserRepository;

// import lombok.Getter;
// import lombok.RequiredArgsConstructor;
// import lombok.Setter;

// @Service
// @RequiredArgsConstructor
// public class DashboardService {
//     private final UserRepository userRepository;
//     private final TransactionalRepository transactionRepository;
//     private final GoalRepository goalRepository;
//     private final BudgetRepository budgetRepository;

//     public User getCurrentUser() {
//         String username = SecurityContextHolder.getContext().getAuthentication().getName();
//         return userRepository.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
//     }

//     public DashboardResponse getDashboardData() {
    
//     }
// =======

// public class DashboardService {

// >>>>>>> e4c63c2338807c14082607cf176afd05ebba787f
// }
