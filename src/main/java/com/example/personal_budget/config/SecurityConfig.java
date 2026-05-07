package com.example.personal_budget.config;

import com.example.personal_budget.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;

import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] WHITE_LIST_URL = {"/api/auth/**",
            "/v2/api-docs",
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-resources",
            "/swagger-resources/**",
            "/configuration/ui",
            "/configuration/security",
            "/swagger-ui/**",
            "/webjars/**",
            "/swagger-ui.html"};
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final LogoutHandler logoutHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

http
    .csrf(AbstractHttpConfigurer::disable)
    .sessionManagement(session ->
        session.sessionCreationPolicy(STATELESS)
    )
    
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers("/login", "/register").permitAll()
        .requestMatchers("/css/**", "/js/**", "/images/**", "/static/**").permitAll()
        .requestMatchers("/v2/api-docs", "/v3/api-docs/**", "/swagger-ui/**",
                         "/swagger-resources/**", "/webjars/**").permitAll()
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated()
    )

    .exceptionHandling(ex -> ex
        .authenticationEntryPoint((request, response, authException) -> {
            // ─── API calls → return 401 JSON ────────────
            if (request.getRequestURI().startsWith("/api/")) {
                response.setStatus(401);
                response.getWriter().write("{\"error\":\"Unauthorized\"}");
            } else {
                // ─── Page visits → redirect to /login ───
                response.sendRedirect("/login");
            }
        })
    )

    .authenticationProvider(authenticationProvider)
    .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
    .logout(logout -> logout
        .logoutUrl("/api/auth/logout")
        .addLogoutHandler(logoutHandler)
        .logoutSuccessHandler((request, response, authentication) ->
            SecurityContextHolder.clearContext())
    );

        return http.build();
    }
}