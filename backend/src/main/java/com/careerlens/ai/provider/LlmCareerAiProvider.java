package com.careerlens.ai.provider;

import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.ai.provider.contracts.CareerAssistantAnswer;
import com.careerlens.ai.provider.contracts.CareerActionPlanResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapStage;
import com.careerlens.ai.provider.contracts.InterviewPreparationResult;
import com.careerlens.ai.provider.contracts.ProjectRecommendation;
import com.careerlens.ai.provider.contracts.ProjectRecommendationResult;
import com.careerlens.ai.provider.contracts.ResumeImprovementResult;
import com.careerlens.exception.CareerAiProviderException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class LlmCareerAiProvider implements CareerAiProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final CareerAiPromptBuilder promptBuilder;
    private final LlmProperties properties;

    @Override
    public String providerName() {
        return "llm";
    }

    public LlmCareerAiProvider(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            CareerAiPromptBuilder promptBuilder,
            LlmProperties properties) {
        validate(properties);
        this.restClient = restClientBuilder
            .baseUrl(trimTrailingSlash(properties.getBaseUrl()))
            .requestFactory(requestFactory(properties.getTimeout()))
            .build();
        this.objectMapper = objectMapper;
        this.promptBuilder = promptBuilder;
        this.properties = properties;
        }

        public LlmCareerAiProvider(
            RestClient restClient,
            ObjectMapper objectMapper,
            CareerAiPromptBuilder promptBuilder,
            LlmProperties properties) {
        validate(properties);
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.promptBuilder = promptBuilder;
        this.properties = properties;
    }

    @Override
    public CareerAssistantAnswer answerCareerQuestion(UserCareerContext context, String question) {
        JsonNode result = request(promptBuilder.questionPrompt(context, question),
            "{\"answer\":\"string\",\"followUpSuggestions\":[\"string\"]}");
        return new CareerAssistantAnswer(requiredText(result, "answer"), requiredStringList(result, "followUpSuggestions"));
    }

    @Override
    public CareerActionPlanResult generateActionPlan(UserCareerContext context) {
        JsonNode result = requestTask(context, "Create a concise prioritized action plan.", "{\"actions\":[\"string\"]}");
        return new CareerActionPlanResult(requiredStringList(result, "actions"));
    }

    @Override
    public ResumeImprovementResult improveResume(UserCareerContext context) {
        JsonNode result = requestTask(context, "Identify resume weaknesses, missing content, and truthful wording improvements.",
                "{\"weakAreas\":[\"string\"],\"missingContent\":[\"string\"],\"strongerWordingSuggestions\":[\"string\"]}");
        return new ResumeImprovementResult(
                requiredStringList(result, "weakAreas"),
                requiredStringList(result, "missingContent"),
                requiredStringList(result, "strongerWordingSuggestions"));
    }

    @Override
    public CareerRoadmapResult generateCareerRoadmap(UserCareerContext context) {
        JsonNode result = requestTask(context, "Create short, medium, and long-term roadmap stages.",
                "{\"stages\":[{\"name\":\"string\",\"objective\":\"string\",\"actions\":[\"string\"],\"skills\":[\"string\"]}]}");
        JsonNode stages = requiredArray(result, "stages");
        List<CareerRoadmapStage> mapped = new ArrayList<>();
        for (JsonNode stage : stages) {
            mapped.add(new CareerRoadmapStage(
                    requiredText(stage, "name"), requiredText(stage, "objective"),
                    requiredStringList(stage, "actions"), requiredStringList(stage, "skills")));
        }
        if (mapped.isEmpty()) throw malformedResponse();
        return new CareerRoadmapResult(mapped);
    }

    @Override
    public ProjectRecommendationResult recommendProjects(UserCareerContext context) {
        JsonNode result = requestTask(context, "Recommend practical, truthful portfolio projects.",
                "{\"recommendations\":[{\"title\":\"string\",\"description\":\"string\",\"skills\":[\"string\"],\"rationale\":\"string\"}]}");
        JsonNode recommendations = requiredArray(result, "recommendations");
        List<ProjectRecommendation> mapped = new ArrayList<>();
        for (JsonNode recommendation : recommendations) {
            mapped.add(new ProjectRecommendation(
                    requiredText(recommendation, "title"), requiredText(recommendation, "description"),
                    requiredStringList(recommendation, "skills"), requiredText(recommendation, "rationale")));
        }
        if (mapped.isEmpty()) throw malformedResponse();
        return new ProjectRecommendationResult(mapped);
    }

    @Override
    public InterviewPreparationResult prepareForInterview(UserCareerContext context) {
        JsonNode result = requestTask(context, "Prepare technical topics, behavioral questions, and project talking points.",
                "{\"technicalTopics\":[\"string\"],\"behavioralQuestions\":[\"string\"],\"projectTalkingPoints\":[\"string\"]}");
        return new InterviewPreparationResult(
                requiredStringList(result, "technicalTopics"),
                requiredStringList(result, "behavioralQuestions"),
                requiredStringList(result, "projectTalkingPoints"));
    }

    private JsonNode requestTask(UserCareerContext context, String task, String outputShape) {
        return request(promptBuilder.contextTaskPrompt(context, task), outputShape);
    }

    private JsonNode request(String userPrompt, String outputShape) {
        Map<String, Object> request = Map.of(
                "model", properties.getModel(),
                "temperature", 0.2,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", promptBuilder.systemPrompt(outputShape)),
                        Map.of("role", "user", "content", userPrompt)));
        try {
            JsonNode response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);
            String content = response == null ? null : response.path("choices").path(0).path("message").path("content").asText(null);
            if (content == null || content.isBlank()) throw malformedResponse();
            return objectMapper.readTree(stripCodeFence(content));
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 429) {
                throw new CareerAiProviderException("The AI provider is rate limited. Please try again later.");
            }
            throw new CareerAiProviderException("The AI provider request failed. Please try again later.");
        } catch (ResourceAccessException exception) {
            throw new CareerAiProviderException("The AI provider timed out or is unreachable. Please try again later.");
        } catch (CareerAiProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw malformedResponse();
        }
    }

    private String requiredText(JsonNode node, String field) {
        String value = node.path(field).asText(null);
        if (value == null || value.isBlank()) throw malformedResponse();
        return value;
    }

    private List<String> requiredStringList(JsonNode node, String field) {
        JsonNode values = requiredArray(node, field);
        List<String> result = new ArrayList<>();
        for (JsonNode value : values) {
            if (!value.isTextual() || value.asText().isBlank()) throw malformedResponse();
            result.add(value.asText());
        }
        return result;
    }

    private JsonNode requiredArray(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (!value.isArray()) throw malformedResponse();
        return value;
    }

    private CareerAiProviderException malformedResponse() {
        return new CareerAiProviderException("The AI provider returned an invalid response.");
    }

    private void validate(LlmProperties values) {
        if (values == null || values.getApiKey() == null || values.getApiKey().isBlank()) {
            throw new IllegalStateException("LLM_API_KEY is required when app.ai.provider=llm");
        }
        if (values.getBaseUrl() == null || values.getBaseUrl().isBlank()) {
            throw new IllegalStateException("LLM_BASE_URL is required when app.ai.provider=llm");
        }
        try {
            URI baseUri = new URI(values.getBaseUrl());
            if (baseUri.getHost() == null || !("http".equalsIgnoreCase(baseUri.getScheme())
                    || "https".equalsIgnoreCase(baseUri.getScheme()))) {
                throw new IllegalStateException("LLM_BASE_URL must be an HTTP(S) URL");
            }
        } catch (URISyntaxException exception) {
            throw new IllegalStateException("LLM_BASE_URL must be a valid HTTP(S) URL", exception);
        }
        if (values.getModel() == null || values.getModel().isBlank()) {
            throw new IllegalStateException("LLM_MODEL is required when app.ai.provider=llm");
        }
        if (values.getTimeout() == null || values.getTimeout().isZero() || values.getTimeout().isNegative()) {
            throw new IllegalStateException("LLM timeout must be positive");
        }
    }

    private SimpleClientHttpRequestFactory requestFactory(Duration timeout) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeout);
        factory.setReadTimeout(timeout);
        return factory;
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String stripCodeFence(String content) {
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```(?:json)?\\s*", "");
            trimmed = trimmed.replaceFirst("\\s*```$", "");
        }
        return trimmed.trim();
    }
}