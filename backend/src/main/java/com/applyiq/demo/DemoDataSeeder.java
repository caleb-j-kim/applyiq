package com.applyiq.demo;

import com.applyiq.users.UserRepository;
import com.applyiq.users.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a fixed demo account on startup so local testing doesn't require
 * registering a throwaway user by hand. Idempotent — checks for the account
 * before creating it, safe to run on every container restart. Controlled by
 * app.demo.enabled (env var DEMO_SEED_ENABLED), on by default for local dev.
 */
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo.enabled:true}")
    private boolean enabled;

    @Value("${app.demo.email:demo@applyiq.com}")
    private String demoEmail;

    @Value("${app.demo.password:demo1234}")
    private String demoPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        if (userRepository.existsByEmail(demoEmail)) {
            return;
        }

        userService.createUser("Demo", "User", demoEmail, passwordEncoder.encode(demoPassword));
        log.info("Seeded demo account: {} / {}", demoEmail, demoPassword);
    }
}
