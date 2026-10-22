package com.applyiq.auth;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * Time-based one-time passwords (RFC 6238 over RFC 4226 HOTP): HMAC-SHA1, 6 digits, 30-second
 * steps — the defaults every authenticator app (Google Authenticator, Authy, 1Password, ...)
 * uses. Written against the JDK rather than a TOTP library; it's the one algorithm below.
 */
final class Totp {

    static final int DIGITS = 6;
    private static final long STEP_SECONDS = 30;
    // Accept the previous and next step too, for phones whose clock is a little off.
    private static final int DRIFT_STEPS = 1;
    private static final String BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom RANDOM = new SecureRandom();

    private Totp() {
    }

    /** A new 160-bit secret, Base32-encoded the way authenticator apps expect it. */
    static String newSecret() {
        byte[] bytes = new byte[20];
        RANDOM.nextBytes(bytes);
        return base32Encode(bytes);
    }

    static long currentStep() {
        return Instant.now().getEpochSecond() / STEP_SECONDS;
    }

    /**
     * Returns the time step the code matched, or -1. Steps at or before {@code lastUsedStep} are
     * rejected so a code that was already used (e.g. seen over someone's shoulder) can't be replayed.
     */
    static long verify(String base32Secret, String code, long lastUsedStep) {
        if (code == null || !code.matches("\\d{" + DIGITS + "}")) return -1;
        byte[] key = base32Decode(base32Secret);
        long now = currentStep();
        for (long step = now - DRIFT_STEPS; step <= now + DRIFT_STEPS; step++) {
            // Constant-time compare so response timing doesn't leak how many digits matched.
            if (step > lastUsedStep && MessageDigest.isEqual(code(key, step).getBytes(), code.getBytes())) {
                return step;
            }
        }
        return -1;
    }

    static String code(byte[] key, long step) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
            return String.format("%0" + DIGITS + "d", binary % 1_000_000);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA1 unavailable", e);
        }
    }

    static String base32Encode(byte[] data) {
        StringBuilder out = new StringBuilder();
        int buffer = 0, bits = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                out.append(BASE32.charAt((buffer >> (bits - 5)) & 31));
                bits -= 5;
            }
        }
        if (bits > 0) out.append(BASE32.charAt((buffer << (5 - bits)) & 31));
        return out.toString();
    }

    static byte[] base32Decode(String encoded) {
        String s = encoded.replace("=", "").replace(" ", "").toUpperCase();
        ByteBuffer out = ByteBuffer.allocate(s.length() * 5 / 8);
        int buffer = 0, bits = 0;
        for (char c : s.toCharArray()) {
            int value = BASE32.indexOf(c);
            if (value < 0) throw new IllegalArgumentException("Not Base32: " + c);
            buffer = (buffer << 5) | value;
            bits += 5;
            if (bits >= 8) {
                out.put((byte) (buffer >> (bits - 8)));
                bits -= 8;
            }
        }
        return out.array();
    }
}
