package com.example.personal_budget.jwt;

import com.example.personal_budget.repository.TokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final TokenRepository tokenRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String jwt = extractJwt(request);

        // No token → continue as anonymous (Spring will decide access)
        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String userEmail;

        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            System.out.println("❌ Invalid JWT structure: " + e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        if (userEmail == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // If already authenticated → skip
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

        // ✅ STEP 1: JWT signature validation
        boolean isJwtValid = jwtService.isTokenValid(jwt, userDetails);

        // ✅ STEP 2: DB check (safe fallback, NOT mandatory for auth)
        boolean isTokenStoredAndValid = tokenRepository
                .findByToken(jwt)
                .map(t -> !t.isExpired() && !t.isRevoked())
                .orElse(true); // IMPORTANT FIX: default TRUE to avoid accidental 403

        if (isJwtValid && isTokenStoredAndValid) {

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authToken);

        } else {
            System.out.println("❌ JWT rejected:");
            System.out.println("   isJwtValid = " + isJwtValid);
            System.out.println("   isTokenStoredAndValid = " + isTokenStoredAndValid);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT from cookie or Authorization header
     */
    private String extractJwt(HttpServletRequest request) {

        // 1. Cookie (preferred)
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        // 2. Authorization header fallback
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    }
}