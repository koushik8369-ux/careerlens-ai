package com.careerlens.ai.provider.contracts;

import java.util.List;

public record CareerActionPlanResult(List<String> actions) {

    public CareerActionPlanResult {
        actions = List.copyOf(actions);
    }
}