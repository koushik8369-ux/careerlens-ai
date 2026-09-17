package com.careerlens.ai.provider.contracts;

import java.util.List;

public record CareerRoadmapStage(
        String name,
        String objective,
        List<String> actions,
        List<String> skills) {

    public CareerRoadmapStage {
        actions = List.copyOf(actions);
        skills = List.copyOf(skills);
    }
}
