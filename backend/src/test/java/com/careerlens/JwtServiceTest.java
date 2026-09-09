package com.careerlens;

import com.careerlens.security.JwtService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    @Test
    void rejectsSecretShorterThan32Utf8BytesWithoutExposingSecret() {
        String secret = "short-secret";

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> new JwtService(secret, 3_600_000L)
        );

        assertEquals(
                "JWT_SECRET must contain at least 32 UTF-8 bytes for HS256 signing",
                exception.getMessage());
    }

    @Test
    void acceptsSecretWithAtLeast32Utf8Bytes() {
        assertDoesNotThrow(() -> new JwtService(
                "test-secret-that-is-at-least-32-characters-long",
                3_600_000L));
    }
}