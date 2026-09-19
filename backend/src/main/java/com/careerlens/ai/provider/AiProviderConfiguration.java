package com.careerlens.ai.provider;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(LlmProperties.class)
public class AiProviderConfiguration {

    @Bean
    public CareerAiPromptBuilder careerAiPromptBuilder(com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        return new CareerAiPromptBuilder(objectMapper);
    }

    @Bean
    @ConditionalOnProperty(name = "app.ai.provider", havingValue = "llm")
    public LlmCareerAiProvider llmCareerAiProvider(
            RestClient.Builder restClientBuilder,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper,
            CareerAiPromptBuilder promptBuilder,
            LlmProperties properties) {
        return new LlmCareerAiProvider(restClientBuilder, objectMapper, promptBuilder, properties);
    }
}