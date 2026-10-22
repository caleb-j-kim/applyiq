package com.applyiq.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    // Marks the short-lived token handed out after a correct password when 2FA is on. It only
    // works for POST /api/auth/login/2fa; isValid() rejects it everywhere else.
    private static final String TYPE_CLAIM = "typ";
    private static final String TWO_FACTOR_CHALLENGE = "2fa-challenge";
    private static final long CHALLENGE_TTL_MS = 5 * 60 * 1000;

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                       @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public String generateTwoFactorChallenge(String email) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)
                .claim(TYPE_CLAIM, TWO_FACTOR_CHALLENGE)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + CHALLENGE_TTL_MS))
                .signWith(key)
                .compact();
    }

    /** The email a still-valid 2FA challenge was issued for, or null. */
    public String extractTwoFactorChallengeEmail(String token) {
        try {
            Claims claims = parseClaims(token);
            return TWO_FACTOR_CHALLENGE.equals(claims.get(TYPE_CLAIM)) && claims.getExpiration().after(new Date())
                    ? claims.getSubject()
                    : null;
        } catch (Exception e) {
            return null;
        }
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /** A valid session token. A 2FA challenge token is not one — it must not grant access to the API. */
    public boolean isValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(new Date()) && claims.get(TYPE_CLAIM) == null;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
