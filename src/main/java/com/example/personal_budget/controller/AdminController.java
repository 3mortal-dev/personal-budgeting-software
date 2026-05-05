package com.example.personal_budget.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminController {

    @GetMapping("/users")
    public String getUsers() {
        return "home";
    }

}