package com.example.personal_budget.jwt;

import com.example.personal_budget.dto.request.AuthenticationRequest;
import com.example.personal_budget.dto.request.RegisterRequest;
import com.example.personal_budget.dto.response.AuthenticationResponse;
import com.example.personal_budget.entity.Token;
import com.example.personal_budget.entity.User;
import com.example.personal_budget.enums.Role;
import com.example.personal_budget.enums.TokenType;
import com.example.personal_budget.repository.TokenRepository;
import com.example.personal_budget.repository.UserRepository;
import com.example.personal_budget.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;

    /**
     * Registers a new user, stores their first valid JWT token, and returns that
     * token for cookie-based authentication.
     *
     * @param request the registration details
     * @return a signed JWT for the new user
     */
    public String register(RegisterRequest request) {
         if (userService.userExistsByEmail(request.email())) {
        throw new RuntimeException("Email already in use");
    }
        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();

        userRepository.save(user);
        String jwtToken = jwtService.generateToken(user);
        saveUserToken(user, jwtToken);
        return jwtToken;   
    }

    /**
     * Authenticates a user, revokes previous active tokens, and issues a fresh JWT.
     *
     * @param request the login credentials
     * @return a signed JWT for the authenticated user
     */
    public String authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        revokeAllUserTokens(user);
        String jwtToken = jwtService.generateToken(user);
        saveUserToken(user, jwtToken);
        return jwtToken; 
    }

    private void revokeAllUserTokens(User user) {
        List<Token> validTokens = tokenRepository.findAllValidTokenByUser(user.getId());
        if (validTokens.isEmpty()) {
            return;
        }
        validTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(validTokens);
    }

    private void saveUserToken(User user, String jwtToken) {
        Token token = Token.builder()
                .user(user)
                .token(jwtToken)
                .tokenType(TokenType.BEARER)
                .expired(false)
                .revoked(false)
                .build();
        tokenRepository.save(token);
    }
}
