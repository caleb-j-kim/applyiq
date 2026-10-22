package com.applyiq.common;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding-window attempt counter shared by the per-IP auth throttle (RateLimitingFilter) and
 * per-user limits like sending email or entering 2FA codes.
 *
 * ponytail: in-memory, fine for one backend instance; move the counts to a shared store
 * (e.g. Redis) if this ever runs as multiple instances behind a load balancer.
 */
@Component
public class RateLimiter {

    private final Map<String, Deque<Instant>> attemptsByKey = new ConcurrentHashMap<>();

    /** Records an attempt and returns whether fewer than maxAttempts happened in the trailing window. */
    public boolean tryAcquire(String key, int maxAttempts, Duration window) {
        Instant now = Instant.now();
        Instant windowStart = now.minus(window);
        Deque<Instant> attempts = attemptsByKey.computeIfAbsent(key, k -> new ArrayDeque<>());
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

    /** Forgets the attempts for a key: after a correct password/code, only failures should count. */
    public void reset(String key) {
        attemptsByKey.remove(key);
    }
}
