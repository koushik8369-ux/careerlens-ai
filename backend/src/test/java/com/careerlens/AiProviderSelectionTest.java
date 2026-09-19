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
    void llmSelectionRequiresAnApiKey() {
        contextRunner.withPropertyValues("app.ai.provider=llm", "app.ai.llm.api-key=")
                .run(context -> assertTrue(context.getStartupFailure() != null));
    }
}