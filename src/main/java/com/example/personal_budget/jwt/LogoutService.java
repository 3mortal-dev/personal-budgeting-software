package com.example.personal_budget.jwt;

import com.example.personal_budget.repository.TokenRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LogoutService implements LogoutHandler {

    private final TokenRepository tokenRepository;

    @Override
    public void logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) {
        String jwt = extractJwtFromCookie(request);

        if (jwt == null) {
            final String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
            }
        }

        if (jwt != null) {
            var storedToken = tokenRepository.findByToken(jwt).orElse(null);
            if (storedToken != null) {
                storedToken.setExpired(true);
                storedToken.setRevoked(true);
                tokenRepository.save(storedToken);
            }
        }

        // Clear the httpOnly cookie from browser
        ResponseCookie clearCookie = ResponseCookie.from("jwt", "").httpOnly(true).secure(true).path("/").maxAge(
                        0)          // ← maxAge(0) tells browser to delete it
                .sameSite("Strict").build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        SecurityContextHolder.clearContext();
    }

    private String extractJwtFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if ("jwt".equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }
}