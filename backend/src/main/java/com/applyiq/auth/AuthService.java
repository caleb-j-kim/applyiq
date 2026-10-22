package com.applyiq.auth;

import com.applyiq.common.exception.BadRequestException;
import com.applyiq.users.User;
import com.applyiq.users.UserResponse;
import com.applyiq.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final TwoFactorService twoFactorService;

    public AuthResponse register(RegisterRequest request) {
        User user = userService.createUser(
                request.firstName(),
                request.lastName(),
                request.email(),
                passwordEncoder.encode(request.password()));

        String token = jwtService.generateToken(user.getEmail());
        return AuthResponse.of(token, UserResponse.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userService.getByEmail(request.email());
        if (user.isTotpEnabled()) {
            return AuthResponse.twoFactorChallenge(jwtService.generateTwoFactorChallenge(user.getEmail()));
        }
        String token = jwtService.generateToken(user.getEmail());
        return AuthResponse.of(token, UserResponse.from(user));
    }

    /** Second login step when 2FA is on: the challenge from {@link #login} plus an app or recovery code. */
    public AuthResponse completeTwoFactorLogin(String challengeToken, String code) {
        String email = jwtService.extractTwoFactorChallengeEmail(challengeToken);
        if (email == null) throw new BadRequestException("Your sign-in expired. Log in again.");
        User user = userService.getByEmail(email);
        if (!twoFactorService.verify(user, code)) {
            throw new BadRequestException("That code isn't right. Check your authenticator app, or use a recovery code.");
        }
        return AuthResponse.of(jwtService.generateToken(user.getEmail()), UserResponse.from(user));
    }
}
