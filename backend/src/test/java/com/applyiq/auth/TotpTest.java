package com.applyiq.auth;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TotpTest {

    // RFC 6238 Appendix B test seed for HMAC-SHA1.
    private static final byte[] SEED = "12345678901234567890".getBytes(StandardCharsets.US_ASCII);

    @Test
    void matchesRfc6238TestVectors() {
        // The RFC lists 8-digit codes; a 6-digit code is the last 6 digits of the same value.
        assertEquals("287082", Totp.code(SEED, 59 / 30));          // 94287082
        assertEquals("081804", Totp.code(SEED, 1111111109L / 30)); // 07081804
        assertEquals("005924", Totp.code(SEED, 1234567890L / 30)); // 89005924
        assertEquals("279037", Totp.code(SEED, 2000000000L / 30)); // 69279037
    }

    @Test
    void base32RoundTripsAndMatchesKnownEncoding() {
        assertEquals("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", Totp.base32Encode(SEED));
        assertArrayEquals(SEED, Totp.base32Decode("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"));
        String secret = Totp.newSecret();
        assertEquals(32, secret.length()); // 160 bits
        assertArrayEquals(Totp.base32Decode(secret), Totp.base32Decode(secret.toLowerCase()));
    }

    @Test
    void acceptsCurrentCodeOnceAndRejectsReplayAndJunk() {
        String secret = Totp.base32Encode(SEED);
        String now = Totp.code(SEED, Totp.currentStep());
        long step = Totp.verify(secret, now, Long.MIN_VALUE);
        assertTrue(step >= Totp.currentStep() - 1);
        assertEquals(-1, Totp.verify(secret, now, step), "same code can't be used twice");
        assertEquals(-1, Totp.verify(secret, "12345", Long.MIN_VALUE));
        assertEquals(-1, Totp.verify(secret, "abcdef", Long.MIN_VALUE));
    }
}
