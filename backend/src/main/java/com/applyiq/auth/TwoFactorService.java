package com.applyiq.auth;

import com.applyiq.common.RateLimiter;
import com.applyiq.common.TokenCipher;
import com.applyiq.common.exception.BadRequestException;
import com.applyiq.common.exception.TooManyRequestsException;
import com.applyiq.email.EmailConnectionRepository;
import com.applyiq.users.User;
import com.applyiq.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Authenticator-app two-factor authentication, plus password re-confirmation for sensitive
 * actions. Required before connecting Gmail or sending email from it (see email.EmailOAuthService
 * and email.EmailSender), because a connected inbox turns a stolen ApplyIQ login into the ability
 * to send mail as that person.
 */
@Service
@RequiredArgsConstructor
public class TwoFactorService {

    private static final int RECOVERY_CODE_COUNT = 10;
    // Per user, on top of the per-IP limit in RateLimitingFilter: someone rotating IPs still only
    // gets a handful of guesses at a 6-digit code or a password. A correct entry resets the count,
    // so only consecutive failures lock anyone out.
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration ATTEMPT_WINDOW = Duration.ofMinutes(15);
    private static final SecureRandom RANDOM = new SecureRandom();

    public record Status(boolean enabled, int recoveryCodesRemaining) {
    }

    public record Setup(String secret, String otpauthUri) {
    }

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final TokenCipher cipher;
    private final RateLimiter rateLimiter;
    private final EmailConnectionRepository emailConnectionRepository;

    @Value("${app.preview.email:}")
    private String previewEmail;

    public Status status(UUID userId) {
        User user = userService.getById(userId);
        return new Status(user.isTotpEnabled(), user.isTotpEnabled() ? recoveryHashes(user).size() : 0);
    }

    /** Step 1: after re-checking the password, creates a secret for the user to add to their app. */
    public Setup startSetup(UUID userId, String password) {
        User user = userService.getById(userId);
        if (user.getEmail().equalsIgnoreCase(previewEmail)) {
            // Everyone shares this account's password; turning 2FA on would lock all of them out.
            throw new BadRequestException("Two-factor authentication can't be turned on for the shared preview account.");
        }
        if (user.isTotpEnabled()) throw new BadRequestException("Two-factor authentication is already on.");
        confirmPassword(user, password);

        String secret = Totp.newSecret();
        user.setTotpSecretEnc(cipher.encrypt(secret));
        user.setTotpLastStep(null);
        userService.save(user);

        String label = URLEncoder.encode("ApplyIQ:" + user.getEmail(), StandardCharsets.UTF_8).replace("+", "%20");
        return new Setup(secret, "otpauth://totp/" + label + "?secret=" + secret + "&issuer=ApplyIQ&digits=6&period=30");
    }

    /** Step 2: the first valid code from the app turns 2FA on. Returns the one-time recovery codes, shown once. */
    public List<String> enable(UUID userId, String code) {
        User user = userService.getById(userId);
        if (user.isTotpEnabled()) throw new BadRequestException("Two-factor authentication is already on.");
        if (user.getTotpSecretEnc() == null) throw new BadRequestException("Start setup again from Settings.");
        if (!verifyTotp(user, code)) throw new BadRequestException("That code isn't right. Check your authenticator app and try again.");

        List<String> codes = new ArrayList<>();
        List<String> hashes = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            String recovery = Totp.base32Encode(randomBytes(10)).toLowerCase(Locale.ROOT); // 16 chars, 80 bits
            codes.add(String.join("-", recovery.substring(0, 4), recovery.substring(4, 8), recovery.substring(8, 12), recovery.substring(12)));
            hashes.add(sha256(recovery));
        }
        user.setTotpEnabled(true);
        user.setTotpRecoveryHashes(String.join(",", hashes));
        userService.save(user);
        return codes;
    }

    public void disable(UUID userId, String password, String code) {
        User user = userService.getById(userId);
        if (!user.isTotpEnabled()) throw new BadRequestException("Two-factor authentication is already off.");
        if (!emailConnectionRepository.findAllByUser_Id(userId).isEmpty()) {
            throw new BadRequestException("Disconnect Gmail first — two-factor authentication is required while Gmail is connected.");
        }
        confirmPassword(user, password);
        if (!verify(user, code)) throw new BadRequestException("That code isn't right.");
        user.setTotpEnabled(false);
        user.setTotpSecretEnc(null);
        user.setTotpLastStep(null);
        user.setTotpRecoveryHashes(null);
        userService.save(user);
    }

    /** A 6-digit code from the app, or one of the recovery codes (which is then used up). */
    public boolean verify(User user, String code) {
        if (verifyTotp(user, code)) return true;
        String normalized = code == null ? "" : code.replaceAll("[\\s-]", "").toLowerCase(Locale.ROOT);
        List<String> hashes = recoveryHashes(user);
        if (normalized.length() != 16 || !hashes.remove(sha256(normalized))) return false;
        user.setTotpRecoveryHashes(String.join(",", hashes));
        userService.save(user);
        rateLimiter.reset("totp:" + user.getId());
        return true;
    }

    /** Re-checks the account password before a sensitive action, even though the user is logged in. */
    public void confirmPassword(User user, String password) {
        throttle("password:" + user.getId());
        if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadRequestException("Incorrect password.");
        }
        rateLimiter.reset("password:" + user.getId());
    }

    private boolean verifyTotp(User user, String code) {
        throttle("totp:" + user.getId());
        if (user.getTotpSecretEnc() == null || code == null) return false;
        long last = user.getTotpLastStep() == null ? Long.MIN_VALUE : user.getTotpLastStep();
        long step = Totp.verify(cipher.decrypt(user.getTotpSecretEnc()), code.replaceAll("\\s", ""), last);
        if (step < 0) return false;
        user.setTotpLastStep(step);
        userService.save(user);
        rateLimiter.reset("totp:" + user.getId());
        return true;
    }

    private void throttle(String key) {
        if (!rateLimiter.tryAcquire(key, MAX_ATTEMPTS, ATTEMPT_WINDOW)) {
            throw new TooManyRequestsException("Too many attempts. Please wait 15 minutes and try again.");
        }
    }

    private static List<String> recoveryHashes(User user) {
        String stored = user.getTotpRecoveryHashes();
        return stored == null || stored.isBlank() ? new ArrayList<>() : new ArrayList<>(Arrays.asList(stored.split(",")));
    }

    private static byte[] randomBytes(int n) {
        byte[] bytes = new byte[n];
        RANDOM.nextBytes(bytes);
        return bytes;
    }

    // Recovery codes are 80 random bits from SecureRandom, so a fast hash is fine: there's no dictionary
    // to attack and brute-forcing 2^80 offline isn't feasible, unlike a short code.
    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
