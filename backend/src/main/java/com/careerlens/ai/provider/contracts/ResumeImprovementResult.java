package com.careerlens.ai.provider.contracts;

import java.util.List;

public record ResumeImprovementResult(
        List<String> weakAreas,
        List<String> missingContent,
        List<String> strongerWordingSuggestions) {

    public ResumeImprovementResult {
        weakAreas = List.copyOf(weakAreas);
        missingContent = List.copyOf(missingContent);
        strongerWordingSuggestions = List.copyOf(strongerWordingSuggestions);
    }
}
