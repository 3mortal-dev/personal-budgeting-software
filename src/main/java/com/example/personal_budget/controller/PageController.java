package com.example.personal_budget.controller;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
public class PageController {

    private boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        if (auth instanceof AnonymousAuthenticationToken) return false;
        return auth.isAuthenticated();
    }

    // ─── Auth Pages ─────────────────────────────────────────────
    @GetMapping("/login")
    public String loginPage() {
        if (isAuthenticated()) return "redirect:/dashboard";
        return "login";
    }

    @GetMapping("/register")
    public String registerPage() {
        if (isAuthenticated()) return "redirect:/dashboard";
        return "register";
    }

    @GetMapping("/userProfile")
    public String profilePage() {
        if (!isAuthenticated()) return "redirect:/login";
        return "userProfile";
    }

    @GetMapping({"/", "/index"})
    public String indexPage() {
        if (isAuthenticated()) return "redirect:/dashboard";
        return "index";
    }

    @GetMapping("/goals")
    public String goalsPage() {
        if (!isAuthenticated()) return "redirect:/login";
        return "goals";
    }

    @GetMapping("/budget")
    public String budgetPage() {
        if (!isAuthenticated()) return "redirect:/login";
        return "budget";
    }

    @GetMapping("/transactions")
    public String transactionsPage() {
        if (!isAuthenticated()) return "redirect:/login";
        return "transactions";
    }

    @GetMapping("/dashboard")
    public String dashboardPage() {
        if (!isAuthenticated()) return "redirect:/login";
        return "dashboard";
    }

    @GetMapping("/notifications")
    public String notificationPage() {
        if (!isAuthenticated()) return "redirect:/login";
        return "notifications";
    }

    @GetMapping("/reports")
    public String reportsPage() {
        if (!isAuthenticated()) return "redirect:/login";
        return "reports";
    }

    @GetMapping("/admin")
    public String adminPage() {
        if (!isAuthenticated()) return "redirect:/login";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) return "redirect:/dashboard";
        return "admin";
    }

    @GetMapping("/bank-simulator")
    public String bankSimulator() {
        return "bankSimulator";
    }
}
