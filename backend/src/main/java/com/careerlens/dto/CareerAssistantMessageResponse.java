package com.careerlens.dto;

import com.careerlens.entity.CareerAssistantMessage;

import java.time.LocalDateTime;

public record CareerAssistantMessageResponse(
        Long id,
        CareerAssistantMessage.Role role,
        String content,
        String provider,
        LocalDateTime createdAt) {
}