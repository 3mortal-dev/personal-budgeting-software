package com.example.personal_budget.controller;

import com.example.personal_budget.dto.request.AuthenticationRequest;
import com.example.personal_budget.dto.request.RegisterRequest;
import com.example.personal_budget.jwt.AuthenticationService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;      


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    /**
     * Registers a new account and stores the issued JWT in an HTTP-only cookie.
     *
     * @param request the registration details
     * @param response the servlet response used to add the JWT cookie
     * @return a success message or validation error message
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @RequestBody RegisterRequest request,
            HttpServletResponse response 
    ) 
    
    {

   try {
        authenticationService.register(request);
        return ResponseEntity.ok(Map.of("message", "Registered successfully"));

    } catch (RuntimeException e) {
        return ResponseEntity.badRequest()
               .body(Map.of("message", e.getMessage()));
    }
    }

    /**
     * Authenticates a user and stores the issued JWT in an HTTP-only cookie.
     *
     * @param request the login credentials
     * @param response the servlet response used to add the JWT cookie
     * @return a login success message
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> authenticate(
            @RequestBody AuthenticationRequest request,
            HttpServletResponse response
    ) {
        String token = authenticationService.authenticate(request);
        addJwtCookie(response, token);
        return ResponseEntity.ok(Map.of("message", "Login successful"));
    }

    private void addJwtCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofDays(1))
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
