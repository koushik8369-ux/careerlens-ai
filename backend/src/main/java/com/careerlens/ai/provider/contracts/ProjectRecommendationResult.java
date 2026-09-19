package com.careerlens.ai.provider.contracts;

import java.util.List;

public record ProjectRecommendationResult(
        List<ProjectRecommendation> recommendations) {

    public ProjectRecommendationResult {
        recommendations = List.copyOf(recommendations);
    }
}