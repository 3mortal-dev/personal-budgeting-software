package com.example.personal_budget.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@Controller
public class PageController {

    // ─── Auth Pages ─────────────────────────────────────────────
    @GetMapping("/login") // html fileName ya 3mortal
    public String loginPage() { return "login"; }

    @GetMapping("/register")
    public String registerPage() { return "register"; }

    @GetMapping("/userProfile")
    public String profilePage() { return "userProfile"; }

    @GetMapping("/index")
    public String indexPage() { return "index"; }

    @GetMapping("/goals")
    public String goalsPage() { return "goals"; }

    @GetMapping("/budget")
    public String budgetPage() { return "budget"; }
    
    @GetMapping("/transactions")
    public String transactionsPage() { return "transactions"; }

    
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