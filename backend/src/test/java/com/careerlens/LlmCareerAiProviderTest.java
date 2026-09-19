package com.careerlens;

import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.ai.provider.CareerAiPromptBuilder;
import com.careerlens.ai.provider.LlmCareerAiProvider;
import com.careerlens.ai.provider.LlmProperties;
import com.careerlens.ai.provider.contracts.CareerAssistantAnswer;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.ProjectRecommendationResult;
import com.careerlens.exception.CareerAiProviderException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpMethod.POST;

class LlmCareerAiProviderTest {

    private MockRestServiceServer server;
    private LlmCareerAiProvider provider;
    private UserCareerContext context;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:9999/v1");
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new LlmCareerAiProvider(builder.build(), new ObjectMapper(), new CareerAiPromptBuilder(new ObjectMapper()), properties());
        context = new UserCareerContext(
                "Backend Engineer", List.of("Java"), null, null, null, "private bio", List.of("Java"),
                List.of(), List.of("Built APIs"), List.of("Private project"), List.of("Certifications"),
                List.of("Add impact"), "Backend Engineer", "Example Co", 80, List.of("Java"),
                List.of("Docker"), List.of("Java"), List.of("Docker"), List.of());
    }

    @Test
    void mapsChatResponseAndSendsOnlyBoundedContext() {
        server.expect(requestTo("http://localhost:9999/v1/chat/completions"))
                .andExpect(method(POST))
                .andExpect(header("Authorization", "Bearer test-key"))
                .andExpect(jsonPath("$.model").value("test-model"))
                .andExpect(jsonPath("$.messages[1].content").value(org.hamcrest.Matchers.containsString("Backend Engineer")))
                .andExpect(jsonPath("$.messages[1].content").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("rawText"))))
                .andRespond(withSuccess("{\"choices\":[{\"message\":{\"content\":\"{\\\"answer\\\":\\\"Focus on Java.\\\",\\\"followUpSuggestions\\\":[\\\"Practice APIs.\\\"]}\"}}]}", org.springframework.http.MediaType.APPLICATION_JSON));

        CareerAssistantAnswer result = provider.answerCareerQuestion(context, "What should I learn?");

        assertEquals("Focus on Java.", result.answer());
        assertEquals(List.of("Practice APIs."), result.followUpSuggestions());
        server.verify();
    }

    @Test
    void mapsRoadmapAndProjectContracts() {
        server.expect(requestTo("http://localhost:9999/v1/chat/completions"))
                .andRespond(withSuccess("{\"choices\":[{\"message\":{\"content\":\"{\\\"stages\\\":[{\\\"name\\\":\\\"SHORT_TERM\\\",\\\"objective\\\":\\\"Build foundations.\\\",\\\"actions\\\":[\\\"Practice Java.\\\"],\\\"skills\\\":[\\\"Java\\\"]}]}\"}}]}", org.springframework.http.MediaType.APPLICATION_JSON));
        CareerRoadmapResult roadmap = provider.generateCareerRoadmap(context);
        assertEquals("SHORT_TERM", roadmap.stages().get(0).name());

        server.reset();
        server.expect(requestTo("http://localhost:9999/v1/chat/completions"))
                .andRespond(withSuccess("{\"choices\":[{\"message\":{\"content\":\"{\\\"recommendations\\\":[{\\\"title\\\":\\\"API project\\\",\\\"description\\\":\\\"Build it.\\\",\\\"skills\\\":[\\\"Java\\\"],\\\"rationale\\\":\\\"Shows evidence.\\\"}]}\"}}]}", org.springframework.http.MediaType.APPLICATION_JSON));
        ProjectRecommendationResult projects = provider.recommendProjects(context);
        assertEquals("API project", projects.recommendations().get(0).title());
        server.verify();
    }

    @Test
    void acceptsJsonCodeFenceAndRejectsMalformedResponse() {
        server.expect(requestTo("http://localhost:9999/v1/chat/completions"))
                .andRespond(withSuccess("{\"choices\":[{\"message\":{\"content\":\"```json\\n{\\\"actions\\\":[\\\"Do this.\\\"]}\\n```\"}}]}", org.springframework.http.MediaType.APPLICATION_JSON));
        assertEquals(List.of("Do this."), provider.generateActionPlan(context).actions());

        server.reset();
        server.expect(requestTo("http://localhost:9999/v1/chat/completions"))
                .andRespond(withSuccess("{\"choices\":[{\"message\":{\"content\":\"not json\"}}]}", org.springframework.http.MediaType.APPLICATION_JSON));
        assertThrows(CareerAiProviderException.class, () -> provider.improveResume(context));
        server.verify();
    }

    @Test
    void convertsRateLimitToSafeApplicationError() {
        server.expect(requestTo("http://localhost:9999/v1/chat/completions"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).body("secret upstream body"));

        CareerAiProviderException exception = assertThrows(
                CareerAiProviderException.class, () -> provider.prepareForInterview(context));

        assertTrue(exception.getMessage().contains("rate limited"));
        assertTrue(!exception.getMessage().contains("secret"));
    }

    @Test
    void rejectsMissingConfigurationBeforeBuildingClient() {
        LlmProperties invalid = properties();
        invalid.setApiKey("");

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> new LlmCareerAiProvider(RestClient.builder(), new ObjectMapper(),
                        new CareerAiPromptBuilder(new ObjectMapper()), invalid));

        assertTrue(exception.getMessage().contains("LLM_API_KEY"));
    }

    private LlmProperties properties() {
        LlmProperties properties = new LlmProperties();
        properties.setApiKey("test-key");
        properties.setBaseUrl("http://localhost:9999/v1");
        properties.setModel("test-model");
        properties.setTimeout(Duration.ofSeconds(2));
        return properties;
    }
}