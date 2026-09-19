package com.careerlens.ai.provider.contracts;

import java.util.List;

public record ProjectRecommendation(
        String title,
        String description,
        List<String> skills,
        String rationale) {

    public ProjectRecommendation {
        skills = List.copyOf(skills);
    }
}