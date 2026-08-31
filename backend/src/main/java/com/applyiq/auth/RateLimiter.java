package com.applyiq.auth;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * In-memory sliding-window rate limiter, keyed by an arbitrary caller-supplied string
 * (e.g. "path:clientIp"). Fine for a single backend instance — if this ever runs as
 * multiple instances behind a load balancer, this would need to move to a shared store
 * (e.g. Redis) since each instance would otherwise track its own counts independently.
 */
@Component
public class RateLimiter {

    private final ConcurrentHashMap<String, Deque<Instant>> attemptsByKey = new ConcurrentHashMap<>();

    /**
     * Records an attempt for {@code key} and returns whether it's allowed to proceed —
     * i.e. fewer than {@code maxAttempts} were recorded in the trailing {@code window}.
     */
    public boolean tryAcquire(String key, int maxAttempts, Duration window) {
        Instant now = Instant.now();
        Instant windowStart = now.minus(window);

        Deque<Instant> attempts = attemptsByKey.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());
        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(windowStart)) {
                attempts.pollFirst();
            }
            if (attempts.size() >= maxAttempts) {
                return false;
            }
            attempts.addLast(now);
            return true;
        }
    }
}
