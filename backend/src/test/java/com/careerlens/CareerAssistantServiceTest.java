package com.careerlens;

import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.ai.provider.CareerAiProvider;
import com.careerlens.ai.provider.contracts.CareerAssistantAnswer;
import com.careerlens.ai.provider.contracts.CareerActionPlanResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapStage;
import com.careerlens.ai.provider.contracts.InterviewPreparationResult;
import com.careerlens.ai.provider.contracts.ProjectRecommendation;
import com.careerlens.ai.provider.contracts.ProjectRecommendationResult;
import com.careerlens.ai.provider.contracts.ResumeImprovementResult;
import com.careerlens.entity.CareerAssistantConversation;
import com.careerlens.entity.CareerAssistantMessage;
import com.careerlens.entity.Role;
import com.careerlens.entity.User;
import com.careerlens.repository.CareerAssistantConversationRepository;
import com.careerlens.repository.CareerAssistantMessageRepository;
import com.careerlens.service.CareerContextService;
import com.careerlens.service.CurrentUserService;
import com.careerlens.service.impl.CareerAssistantServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CareerAssistantServiceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private CareerContextService careerContextService;

    @Mock
    private CareerAiProvider careerAiProvider;

    @Mock
    private CareerAssistantConversationRepository conversationRepository;

    @Mock
    private CareerAssistantMessageRepository messageRepository;

    private CareerAssistantServiceImpl service;
    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        service = new CareerAssistantServiceImpl(
                currentUserService,
                careerContextService,
                careerAiProvider,
                conversationRepository,
                messageRepository);
        authenticatedUser = new User("Owner", "owner@example.com", "hashed-password", Role.USER);
        authenticatedUser.setId(7L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("owner@example.com", null, List.of()));
        lenient().when(currentUserService.getRequiredUser("owner@example.com")).thenReturn(authenticatedUser);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsConversationNotOwnedByAuthenticatedUserBeforeReadingMessages() {
        when(conversationRepository.findByIdAndUserId(42L, 7L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getConversationMessages(42L));

        verify(messageRepository, never()).findByConversationIdOrderByCreatedAtAsc(any());
        verify(careerAiProvider, never()).answerCareerQuestion(any(), any());
    }

    @Test
    void sendsQuestionUsingOwnedContextAndPersistsBothRoles() {
        CareerAssistantConversation conversation = new CareerAssistantConversation();
        conversation.setId(42L);
        conversation.setUser(authenticatedUser);
        conversation.setTitle("Career Assistant");
        when(conversationRepository.findByIdAndUserId(42L, 7L)).thenReturn(Optional.of(conversation));
        UserCareerContext context = new UserCareerContext(
                null, List.of(), null, null, null, null, List.of(), List.of(), List.of(), List.of(),
                List.of(), List.of(), null, null, null, List.of(), List.of(), List.of(), List.of(), List.of());
        when(careerContextService.buildForCurrentUser()).thenReturn(context);
        when(careerAiProvider.answerCareerQuestion(context, "What should I learn?"))
                .thenReturn(new CareerAssistantAnswer("Learn the next relevant skill.", List.of()));
        when(messageRepository.save(any(CareerAssistantMessage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.sendMessage(42L, "  What should I learn?  ");

        assertEquals(CareerAssistantMessage.Role.ASSISTANT, response.role());
        assertEquals("Learn the next relevant skill.", response.content());
        assertEquals("deterministic", response.provider());
        ArgumentCaptor<CareerAssistantMessage> messages = ArgumentCaptor.forClass(CareerAssistantMessage.class);
        verify(messageRepository, org.mockito.Mockito.times(2)).save(messages.capture());
        assertEquals(List.of(CareerAssistantMessage.Role.USER, CareerAssistantMessage.Role.ASSISTANT),
                messages.getAllValues().stream().map(CareerAssistantMessage::getRole).toList());
        verify(careerContextService).buildForCurrentUser();
        verify(careerAiProvider).answerCareerQuestion(context, "What should I learn?");
        verify(conversationRepository).save(conversation);
    }

    @Test
    void storesConfiguredLlmProviderLabelOnAssistantMessage() {
        CareerAssistantConversation conversation = new CareerAssistantConversation();
        conversation.setId(43L);
        conversation.setUser(authenticatedUser);
        conversation.setTitle("Career Assistant");
        when(conversationRepository.findByIdAndUserId(43L, 7L)).thenReturn(Optional.of(conversation));
        UserCareerContext context = new UserCareerContext(
                null, List.of(), null, null, null, null, List.of(), List.of(), List.of(), List.of(),
                List.of(), List.of(), null, null, null, List.of(), List.of(), List.of(), List.of(), List.of());
        when(careerContextService.buildForCurrentUser()).thenReturn(context);
        when(careerAiProvider.providerName()).thenReturn("llm");
        when(careerAiProvider.answerCareerQuestion(context, "What should I learn?"))
                .thenReturn(new CareerAssistantAnswer("Use the configured provider.", List.of()));
        when(messageRepository.save(any(CareerAssistantMessage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.sendMessage(43L, "What should I learn?");

        assertEquals("llm", response.provider());
    }

        @Test
        void generatesActionPlanUsingAuthenticatedUserContext() {
                UserCareerContext context = new UserCareerContext(
                                "Backend Engineer", List.of("Java"), null, null, null, null, List.of(), List.of(), List.of(), List.of(),
                                List.of(), List.of(), "Backend Engineer", null, null, List.of("Java"), List.of(), List.of(), List.of(), List.of());
                CareerActionPlanResult result = new CareerActionPlanResult(List.of("Practice Java."));
                when(careerContextService.buildForCurrentUser()).thenReturn(context);
                when(careerAiProvider.generateActionPlan(context)).thenReturn(result);

                assertEquals(result, service.generateActionPlan());

                verify(careerContextService).buildForCurrentUser();
                verify(careerAiProvider).generateActionPlan(context);
        }

        @Test
        void rejectsActionPlanWithoutAuthentication() {
                SecurityContextHolder.clearContext();

                assertThrows(RuntimeException.class, () -> service.generateActionPlan());

                verify(careerContextService, never()).buildForCurrentUser();
                verify(careerAiProvider, never()).generateActionPlan(any());
        }

        @Test
        void improvesResumeUsingAuthenticatedUserContext() {
                UserCareerContext context = new UserCareerContext(
                                null, List.of(), null, null, null, null, List.of(), List.of(), List.of(), List.of(),
                                List.of(), List.of(), null, null, null, List.of(), List.of(), List.of(), List.of(), List.of());
                ResumeImprovementResult result = new ResumeImprovementResult(
                                List.of("Missing project evidence"), List.of("Add a truthful project"), List.of("Use measurable outcomes"));
                when(careerContextService.buildForCurrentUser()).thenReturn(context);
                when(careerAiProvider.improveResume(context)).thenReturn(result);

                assertEquals(result, service.improveResume());

                verify(careerContextService).buildForCurrentUser();
                verify(careerAiProvider).improveResume(context);
        }

        @Test
        void rejectsResumeImprovementWithoutAuthentication() {
                SecurityContextHolder.clearContext();

                assertThrows(RuntimeException.class, () -> service.improveResume());

                verify(careerContextService, never()).buildForCurrentUser();
                verify(careerAiProvider, never()).improveResume(any());
        }

        @Test
        void generatesRoadmapUsingAuthenticatedUserContext() {
                UserCareerContext context = new UserCareerContext(
                                "Backend Engineer", List.of("Java"), null, null, null, null, List.of(), List.of(), List.of(), List.of(),
                                List.of(), List.of(), null, null, null, List.of(), List.of(), List.of(), List.of(), List.of());
                CareerRoadmapResult result = new CareerRoadmapResult(List.of(
                                new CareerRoadmapStage("SHORT_TERM", "Build foundations.", List.of("Learn Java"), List.of("Java")),
                                new CareerRoadmapStage("MEDIUM_TERM", "Build evidence.", List.of("Build a project"), List.of("Java")),
                                new CareerRoadmapStage("LONG_TERM", "Sustain progress.", List.of("Review progress"), List.of())));
                when(careerContextService.buildForCurrentUser()).thenReturn(context);
                when(careerAiProvider.generateCareerRoadmap(context)).thenReturn(result);

                assertEquals(result, service.generateRoadmap());

                verify(careerContextService).buildForCurrentUser();
                verify(careerAiProvider).generateCareerRoadmap(context);
        }

        @Test
        void rejectsRoadmapWithoutAuthentication() {
                SecurityContextHolder.clearContext();

                assertThrows(RuntimeException.class, () -> service.generateRoadmap());

                verify(careerContextService, never()).buildForCurrentUser();
                verify(careerAiProvider, never()).generateCareerRoadmap(any());
        }

        @Test
        void recommendsProjectsUsingAuthenticatedUserContext() {
                UserCareerContext context = new UserCareerContext(
                                "Backend Engineer", List.of("Java"), null, null, null, null, List.of(), List.of(), List.of(), List.of(),
                                List.of(), List.of(), null, null, null, List.of("Docker"), List.of(), List.of(), List.of("Docker"), List.of());
                ProjectRecommendationResult result = new ProjectRecommendationResult(List.of(
                                new ProjectRecommendation("Build a Docker project", "Document the implementation.", List.of("Docker"), "Closes a skill gap.")));
                when(careerContextService.buildForCurrentUser()).thenReturn(context);
                when(careerAiProvider.recommendProjects(context)).thenReturn(result);

                assertEquals(result, service.recommendProjects());

                verify(careerContextService).buildForCurrentUser();
                verify(careerAiProvider).recommendProjects(context);
        }

        @Test
        void preparesForInterviewUsingAuthenticatedUserContext() {
                UserCareerContext context = new UserCareerContext(
                                "Backend Engineer", List.of("Java"), null, null, null, null, List.of(), List.of(), List.of(), List.of(),
                                List.of(), List.of(), "Backend Engineer", null, null, List.of("Java"), List.of(), List.of(), List.of(), List.of());
                InterviewPreparationResult result = new InterviewPreparationResult(
                                List.of("Java"), List.of("Describe a challenge."), List.of("Explain your project."));
                when(careerContextService.buildForCurrentUser()).thenReturn(context);
                when(careerAiProvider.prepareForInterview(context)).thenReturn(result);

                assertEquals(result, service.prepareForInterview());

                verify(careerContextService).buildForCurrentUser();
                verify(careerAiProvider).prepareForInterview(context);
        }

        @Test
        void rejectsInterviewPreparationWithoutAuthentication() {
                SecurityContextHolder.clearContext();

                assertThrows(RuntimeException.class, () -> service.prepareForInterview());

                verify(careerContextService, never()).buildForCurrentUser();
                verify(careerAiProvider, never()).prepareForInterview(any());
        }

        @Test
        void rejectsProjectRecommendationsWithoutAuthentication() {
                SecurityContextHolder.clearContext();

                assertThrows(RuntimeException.class, () -> service.recommendProjects());

                verify(careerContextService, never()).buildForCurrentUser();
                verify(careerAiProvider, never()).recommendProjects(any());
        }
}