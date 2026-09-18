package com.careerlens.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CareerAssistantMessageRequest(
        @NotBlank @Size(max = 2000) String question) {
}