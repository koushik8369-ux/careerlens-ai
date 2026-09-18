package com.careerlens.dto;

import jakarta.validation.constraints.NotNull;

public record CareerPlanItemUpdateRequest(@NotNull Boolean completed) {
}