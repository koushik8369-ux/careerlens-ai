package com.careerlens.ai.provider.contracts;

import java.util.List;

public record CareerRoadmapResult(
        List<CareerRoadmapStage> stages) {

    public CareerRoadmapResult {
        stages = List.copyOf(stages);
    }
}
