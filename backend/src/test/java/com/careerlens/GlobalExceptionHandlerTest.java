package com.careerlens;

import com.careerlens.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GlobalExceptionHandlerTest {

    @Test
    void genericErrorsUseStableSafeMessage() {
        ResponseEntity<?> response = new GlobalExceptionHandler()
                .handleGeneralException(new RuntimeException("SQL path and secret details"));

        assertEquals(500, response.getStatusCode().value());
        Object body = response.getBody();
        assertEquals("An unexpected internal error occurred", ((com.careerlens.dto.ErrorResponse) body).getMessage());
        assertFalse(((com.careerlens.dto.ErrorResponse) body).getMessage().contains("secret"));
    }
}