package com.careerlens;

import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.ai.provider.CareerAiPromptBuilder;
import com.careerlens.ai.provider.LlmCareerAiProvider;
import com.careerlens.ai.provider.LlmProperties;
import com.careerlens.ai.provider.contracts.CareerAssistantAnswer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class LlmCareerAiProviderSmokeTest {

    @Test
    void callsConfiguredProviderAndMapsCareerAssistantAnswer() {
        assumeTrue(isEnabled(), "LLM smoke test is disabled");

        String apiKey = environment("LLM_API_KEY");
        String baseUrl = environment("LLM_BASE_URL");
        String model = environment("LLM_MODEL");
        String timeout = environment("LLM_TIMEOUT");
        assumeTrue(hasText(apiKey) && hasText(baseUrl) && hasText(model) && hasText(timeout),
                "LLM smoke test requires LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, and LLM_TIMEOUT");

        LlmProperties properties = new LlmProperties();
        properties.setApiKey(apiKey);
        properties.setBaseUrl(baseUrl);
        properties.setModel(model);
        properties.setTimeout(parseTimeout(timeout));

        ObjectMapper objectMapper = new ObjectMapper();
        LlmCareerAiProvider provider = new LlmCareerAiProvider(
                RestClient.builder(), objectMapper, new CareerAiPromptBuilder(objectMapper), properties);

        CareerAssistantAnswer answer = provider.answerCareerQuestion(context(),
                "Give one concise next step for improving Java backend skills.");

        assertNotNull(answer);
        assertTrue(hasText(answer.answer()), "Provider returned an empty answer");
        assertFalse(answer.followUpSuggestions() == null, "Provider returned no follow-up collection");
    }

    private boolean isEnabled() {
        return Boolean.parseBoolean(System.getProperty("llm.smoke.test",
                System.getenv("CAREERLENS_LLM_SMOKE_TEST")));
    }

    private String environment(String name) {
        return System.getenv(name);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private Duration parseTimeout(String value) {
        String trimmed = value.trim().toLowerCase();
        if (trimmed.endsWith("ms")) {
            return Duration.ofMillis(Long.parseLong(trimmed.substring(0, trimmed.length() - 2)));
        }
        if (trimmed.endsWith("m")) {
            return Duration.ofMinutes(Long.parseLong(trimmed.substring(0, trimmed.length() - 1)));
        }
        if (trimmed.endsWith("s")) {
            return Duration.ofSeconds(Long.parseLong(trimmed.substring(0, trimmed.length() - 1)));
        }
        return Duration.parse(trimmed);
    }

    private UserCareerContext context() {
        return new UserCareerContext(
                "Backend Engineer", List.of("Java"), null, null, null, null, List.of("Java"), List.of(),
                List.of(), List.of(), List.of(), List.of(), "Backend Engineer", null, null, List.of("Java"),
                List.of(), List.of(), List.of(), List.of());
    }
}