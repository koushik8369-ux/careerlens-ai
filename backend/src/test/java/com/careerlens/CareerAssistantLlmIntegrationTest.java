package com.careerlens;

import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.ai.provider.CareerAiPromptBuilder;
import com.careerlens.ai.provider.LlmCareerAiProvider;
import com.careerlens.ai.provider.LlmProperties;
import com.careerlens.entity.CareerAssistantConversation;
import com.careerlens.entity.CareerAssistantMessage;
import com.careerlens.entity.Role;
import com.careerlens.entity.User;
import com.careerlens.repository.CareerAssistantConversationRepository;
import com.careerlens.repository.CareerAssistantMessageRepository;
import com.careerlens.service.CareerContextService;
import com.careerlens.service.CurrentUserService;
import com.careerlens.service.impl.CareerAssistantServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CareerAssistantLlmIntegrationTest {

    private MockRestServiceServer server;
    private CareerAssistantServiceImpl service;
    private UserCareerContext context;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:9998/v1");
        server = MockRestServiceServer.bindTo(builder).build();
        ObjectMapper objectMapper = new ObjectMapper();
        LlmProperties properties = new LlmProperties();
        properties.setApiKey("test-key");
        properties.setBaseUrl("http://localhost:9998/v1");
        properties.setModel("test-model");
        properties.setTimeout(Duration.ofSeconds(2));
        LlmCareerAiProvider provider = new LlmCareerAiProvider(
                builder.build(), objectMapper, new CareerAiPromptBuilder(objectMapper), properties);

        CurrentUserService currentUserService = mock(CurrentUserService.class);
        CareerContextService contextService = mock(CareerContextService.class);
        CareerAssistantConversationRepository conversationRepository = mock(CareerAssistantConversationRepository.class);
        CareerAssistantMessageRepository messageRepository = mock(CareerAssistantMessageRepository.class);
        service = new CareerAssistantServiceImpl(
                currentUserService, contextService, provider, conversationRepository, messageRepository);

        User user = new User("Owner", "owner@example.com", "hashed-password", Role.USER);
        user.setId(7L);
        when(currentUserService.getRequiredUser("owner@example.com")).thenReturn(user);
        context = new UserCareerContext(
                "Backend Engineer", List.of("Java"), null, null, null, null, List.of("Java"), List.of(),
                List.of(), List.of(), List.of(), List.of(), "Backend Engineer", null, null, List.of("Java"),
                List.of(), List.of(), List.of(), List.of());
        when(contextService.buildForCurrentUser()).thenReturn(context);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("owner@example.com", null, List.of()));

        CareerAssistantConversation conversation = new CareerAssistantConversation();
        conversation.setId(42L);
        conversation.setUser(user);
        conversation.setTitle("Career Assistant");
        when(conversationRepository.findByIdAndUserId(42L, 7L)).thenReturn(Optional.of(conversation));
        when(messageRepository.save(any(CareerAssistantMessage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void routesAllCareerAssistantOperationsThroughTheSelectedLlmProvider() {
        expect("{\"weakAreas\":[\"Gap\"],\"missingContent\":[\"Evidence\"],\"strongerWordingSuggestions\":[\"Use impact\"]}");
        expect("{\"stages\":[{\"name\":\"SHORT_TERM\",\"objective\":\"Build foundations\",\"actions\":[\"Practice Java\"],\"skills\":[\"Java\"]}]}");
        expect("{\"recommendations\":[{\"title\":\"API project\",\"description\":\"Build it\",\"skills\":[\"Java\"],\"rationale\":\"Shows evidence\"}]}");
        expect("{\"technicalTopics\":[\"Java\"],\"behavioralQuestions\":[\"Tell me about a challenge\"],\"projectTalkingPoints\":[\"Explain the API\"]}");
        expect("{\"actions\":[\"Practice Java\"]}");
        expect("{\"answer\":\"Keep practicing Java.\",\"followUpSuggestions\":[\"Review APIs.\"]}");

        assertEquals("Gap", service.improveResume().weakAreas().get(0));
        assertEquals("SHORT_TERM", service.generateRoadmap().stages().get(0).name());
        assertEquals("API project", service.recommendProjects().recommendations().get(0).title());
        assertEquals("Java", service.prepareForInterview().technicalTopics().get(0));
        assertEquals("Practice Java", service.generateActionPlan().actions().get(0));
        assertEquals("Keep practicing Java.", service.sendMessage(42L, "What should I do next?").content());
        server.verify();
    }

    private void expect(String contractJson) {
        String response = "{\"choices\":[{\"message\":{\"content\":"
                + new ObjectMapper().valueToTree(contractJson) + "}}]}";
        server.expect(requestTo("http://localhost:9998/v1/chat/completions"))
                .andRespond(withSuccess(response, org.springframework.http.MediaType.APPLICATION_JSON));
    }
}