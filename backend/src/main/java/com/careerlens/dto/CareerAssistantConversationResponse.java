package com.careerlens.dto;

import java.time.LocalDateTime;

public record CareerAssistantConversationResponse(
        Long id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}