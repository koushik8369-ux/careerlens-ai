package com.careerlens.ai.provider.contracts;

import java.util.List;

public record CareerAssistantAnswer(
        String answer,
        List<String> followUpSuggestions) {

    public CareerAssistantAnswer {
        followUpSuggestions = List.copyOf(followUpSuggestions);
    }
}
