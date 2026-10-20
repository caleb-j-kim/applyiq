package com.applyiq.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Throttles the unauthenticated auth endpoints — the only ones a caller can hit repeatedly
 * without already holding a valid token — to blunt credential-stuffing/brute-force attempts
 * against login and spam account creation via register. Keyed by client IP, read from
 * X-Forwarded-For since the app sits behind Render's proxy (falls back to the socket address
 * for local/direct requests, e.g. in tests).
 *
 * ponytail: in-memory sliding window, fine for one backend instance; move the counts to a
 * shared store (e.g. Redis) if this ever runs as multiple instances behind a load balancer.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private record Limit(int maxAttempts, Duration window) {
    }

    private static final Map<String, Limit> LIMITS_BY_PATH = Map.of(
            "/api/auth/login", new Limit(10, Duration.ofMinutes(15)),
            "/api/auth/register", new Limit(5, Duration.ofHours(1))
    );

    // A fixed literal, not user input, so hand-writing it avoids pulling a JSON library into
    // this filter just to serialize one static message — matches ApiResponse's {success, data,
    // message} envelope shape.
    private static final String TOO_MANY_ATTEMPTS_BODY =
            "{\"success\":false,\"data\":null,\"message\":\"Too many attempts. Please wait a while before trying again.\"}";

    private final Map<String, Deque<Instant>> attemptsByKey = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        Limit limit = LIMITS_BY_PATH.get(request.getRequestURI());
        if (limit != null && !tryAcquire(request.getRequestURI() + ":" + clientIp(request), limit)) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(TOO_MANY_ATTEMPTS_BODY);
            return;
        }
        filterChain.doFilter(request, response);
    }

    /** Records an attempt and returns whether fewer than maxAttempts happened in the trailing window. */
    private boolean tryAcquire(String key, Limit limit) {
        Instant now = Instant.now();
        Instant windowStart = now.minus(limit.window());
        Deque<Instant> attempts = attemptsByKey.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(windowStart)) {
                attempts.pollFirst();
            }
            if (attempts.size() >= limit.maxAttempts()) {
                return false;
            }
            attempts.addLast(now);
            return true;
        }
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
