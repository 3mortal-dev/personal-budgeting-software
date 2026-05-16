package com.example.personal_budget.controller;

import org.springframework.stereotype.Controller;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
public class PageController {

    // ─── Auth Pages ─────────────────────────────────────────────
    /**
     * Displays the login page.
     *
     * @return the login template name
     */
    @GetMapping("/login") // html fileName ya 3mortal
    public String loginPage() {return "login";}

    /**
     * Displays the registration page.
     *
     * @return the registration template name
     */
    @GetMapping("/register")
    public String registerPage() {return "register";}

    /**
     * Displays the user profile page.
     *
     * @return the profile template name
     */
    @GetMapping("/userProfile")
    public String profilePage() {return "userProfile";}

    /**
     * Displays the home page.
     *
     * @return the index template name
     */
    @GetMapping("/index")
    public String indexPage() {return "index";}

    /**
     * Displays the goals page.
     *
     * @return the goals template name
     */
    @GetMapping("/goals")
    public String goalsPage() {return "goals";}

    /**
     * Displays the budgets page.
     *
     * @return the budget template name
     */
    @GetMapping("/budget")
    public String budgetPage() { return "budget"; }

    /**
     * Displays the transactions page.
     *
     * @return the transactions template name
     */
    @GetMapping("/transactions")
    public String transactionsPage() {return "transactions";}

    /**
     * Displays the dashboard page.
     *
     * @return the dashboard template name
     */
    @GetMapping("/dashboard")
    public String dashboardPage() { return "dashboard"; }

    /**
     * Displays the notifications page.
     *
     * @return the notifications template name
     */
    @GetMapping("/notifications")
    public String notificationPage() {
        return "notifications";
    }

    /**
     * Displays the reports page.
     *
     * @return the reports template name
     */
    @GetMapping("/reports")
    public String reportsPage() {
        return "reports";
    }

    /**
     * Displays the admin page.
     *
     * @return the admin template name
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminPage() {
        return "admin";
    }
    
    /**
     * Displays the bank simulator page.
     *
     * @return the bank simulator template name
     */
    @GetMapping("/bank-simulator")
    public String bankSimulator() {
        return "bankSimulator";
    }

    


    // // ─── Main Pages ──────────────────────────────────────────────
    // @GetMapping("/profile")
    // public String profilePage() { return "profile"; }

    // @GetMapping("/goals")
    // public String goalsPage() { return "goals"; }

    // @GetMapping("/budget")
    // public String budgetPage() { return "budget"; }

    // @GetMapping("/transactions")
    // public String transactionsPage() { return "transactions"; }

    // @GetMapping("/dashboard")
    // public String dashboardPage() { return "dashboard"; }
}
