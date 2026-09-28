package com.careerlens;

import com.careerlens.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SecurityConfigTest {

    @Test
    void usesExplicitConfiguredOriginsWithCredentials() {
        CorsConfiguration configuration = new SecurityConfig("http://localhost:5173, https://demo.example")
                .corsConfigurationSource()
                .getCorsConfiguration(new MockHttpServletRequest());

        assertEquals(java.util.List.of("http://localhost:5173", "https://demo.example"),
                configuration.getAllowedOrigins());
        assertEquals(Boolean.TRUE, configuration.getAllowCredentials());
    }

    @Test
    void rejectsWildcardOriginWhenCredentialsAreEnabled() {
        assertThrows(IllegalStateException.class, () -> new SecurityConfig("*"));
    }
}