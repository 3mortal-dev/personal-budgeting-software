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

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @RequestBody RegisterRequest request,
            HttpServletResponse response   // ← ADD THIS
    ) 
    
    {

   try {
        String token = authenticationService.register(request);
        addJwtCookie(response, token);
        return ResponseEntity.ok(Map.of("message", "Registered successfully"));

    } catch (RuntimeException e) {
        // ─── Send error message back to frontend ──────────
        return ResponseEntity.badRequest()
               .body(Map.of("message", e.getMessage()));
    }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> authenticate(
            @RequestBody AuthenticationRequest request,
            HttpServletResponse response   // ← ADD THIS
    ) {
        String token = authenticationService.authenticate(request);  // ← now returns String
        addJwtCookie(response, token);
        return ResponseEntity.ok(Map.of("message", "Login successful"));
    }

    // ── Cookie builder ──────────────────────────────────────────
    private void addJwtCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)       // JS cannot read it — XSS proof
                .secure(true)         // HTTPS only (set false for localhost dev)
                .path("/")            // sent on every request
                .maxAge(Duration.ofDays(1))
                .sameSite("Strict")   // CSRF protection
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
