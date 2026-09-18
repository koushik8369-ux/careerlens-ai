package com.careerlens.dto;

import com.careerlens.entity.CareerPlan;

import java.time.LocalDateTime;
import java.util.List;

public record CareerPlanResponse(
        Long id,
        Long sourceResumeAnalysisId,
        Long sourceJobAnalysisId,
        String careerGoal,
        CareerPlan.Status status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<CareerPlanItemResponse> items) {
}