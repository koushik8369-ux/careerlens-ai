package com.careerlens;

import com.careerlens.ai.provider.CareerAiProvider;
import com.careerlens.ai.provider.DeterministicCareerAiProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiProviderSelectionTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(com.careerlens.ai.provider.AiProviderConfiguration.class,
                    DeterministicCareerAiProvider.class)
            .withBean(RestClient.Builder.class, RestClient::builder)
            .withBean(ObjectMapper.class, ObjectMapper::new)
            .withPropertyValues("app.ai.provider=deterministic");

    @Test
    void deterministicIsSelectedByDefaultWithoutLlmConfiguration() {
        contextRunner.run(context -> {
            assertInstanceOf(DeterministicCareerAiProvider.class, context.getBean(CareerAiProvider.class));
            assertTrue(!context.containsBean("llmCareerAiProvider"));
        });
    }

        @Test
        void missingProviderPropertyDefaultsToDeterministic() {
        new ApplicationContextRunner()
            .withUserConfiguration(com.careerlens.ai.provider.AiProviderConfiguration.class,
                DeterministicCareerAiProvider.class)
            .withBean(RestClient.Builder.class, RestClient::builder)
            .withBean(ObjectMapper.class, ObjectMapper::new)
            .run(context -> assertInstanceOf(DeterministicCareerAiProvider.class,
                context.getBean(CareerAiProvider.class)));
        }

        @Test
        void llmPropertySelectsLlmProvider() {
        contextRunner.withPropertyValues(
                "app.ai.provider=llm",
                "app.ai.llm.api-key=test-key",
                "app.ai.llm.base-url=http://localhost:9999/v1",
                "app.ai.llm.model=test-model")
            .run(context -> assertInstanceOf(
                com.careerlens.ai.provider.LlmCareerAiProvider.class,
                context.getBean(CareerAiProvider.class)));
        }

    @Test
    void llmSelectionRequiresAnApiKey() {
        contextRunner.withPropertyValues("app.ai.provider=llm", "app.ai.llm.api-key=")
                .run(context -> assertTrue(context.getStartupFailure() != null));
    }
}