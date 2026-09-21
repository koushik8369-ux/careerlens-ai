package com.careerlens.service.impl;

import com.careerlens.ai.provider.CareerAiProvider;
import com.careerlens.ai.provider.contracts.CareerAssistantAnswer;
import com.careerlens.ai.provider.contracts.CareerActionPlanResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.InterviewPreparationResult;
import com.careerlens.ai.provider.contracts.ProjectRecommendationResult;
import com.careerlens.ai.provider.contracts.ResumeImprovementResult;
import com.careerlens.dto.CareerAssistantConversationResponse;
import com.careerlens.dto.CareerAssistantMessageResponse;
import com.careerlens.entity.CareerAssistantConversation;
import com.careerlens.entity.CareerAssistantMessage;
import com.careerlens.entity.User;
import com.careerlens.exception.ResourceNotFoundException;
import com.careerlens.repository.CareerAssistantConversationRepository;
import com.careerlens.repository.CareerAssistantMessageRepository;
import com.careerlens.service.CareerAssistantService;
import com.careerlens.service.CareerContextService;
import com.careerlens.service.CurrentUserService;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CareerAssistantServiceImpl implements CareerAssistantService {

    private static final String DEFAULT_PROVIDER = "deterministic";
    private static final String DEFAULT_TITLE = "Career Assistant";
    private static final int MAX_QUESTION_LENGTH = 2000;

    private final CurrentUserService currentUserService;
    private final CareerContextService careerContextService;
    private final CareerAiProvider careerAiProvider;
    private final CareerAssistantConversationRepository conversationRepository;
    private final CareerAssistantMessageRepository messageRepository;

    public CareerAssistantServiceImpl(
            CurrentUserService currentUserService,
            CareerContextService careerContextService,
            CareerAiProvider careerAiProvider,
            CareerAssistantConversationRepository conversationRepository,
            CareerAssistantMessageRepository messageRepository) {
        this.currentUserService = currentUserService;
        this.careerContextService = careerContextService;
        this.careerAiProvider = careerAiProvider;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @Override
    @Transactional
    public CareerAssistantConversationResponse createConversation() {
        User user = getAuthenticatedUser();
        CareerAssistantConversation conversation = new CareerAssistantConversation();
        conversation.setUser(user);
        conversation.setTitle(DEFAULT_TITLE);
        return toConversationResponse(conversationRepository.save(conversation));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CareerAssistantConversationResponse> getUserConversations() {
        User user = getAuthenticatedUser();
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(this::toConversationResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CareerAssistantMessageResponse> getConversationMessages(Long conversationId) {
        CareerAssistantConversation conversation = getOwnedConversation(conversationId);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Override
    @Transactional
    public CareerAssistantMessageResponse sendMessage(Long conversationId, String question) {
        CareerAssistantConversation conversation = getOwnedConversation(conversationId);
        String normalizedQuestion = validateQuestion(question);

        CareerAssistantMessage userMessage = newMessage(
                conversation, CareerAssistantMessage.Role.USER, normalizedQuestion, null);
        messageRepository.save(userMessage);

        CareerAssistantAnswer answer = careerAiProvider.answerCareerQuestion(
                careerContextService.buildForCurrentUser(), normalizedQuestion);
        String providerName = careerAiProvider.providerName();
        if (providerName == null || providerName.isBlank()) {
            providerName = DEFAULT_PROVIDER;
        }
        CareerAssistantMessage assistantMessage = newMessage(
            conversation, CareerAssistantMessage.Role.ASSISTANT, answer.answer(), providerName);
        CareerAssistantMessage savedAssistantMessage = messageRepository.save(assistantMessage);

        if (DEFAULT_TITLE.equals(conversation.getTitle())) {
            conversation.setTitle(toTitle(normalizedQuestion));
        }
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        return toMessageResponse(savedAssistantMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public CareerActionPlanResult generateActionPlan() {
        getAuthenticatedUser();
        return careerAiProvider.generateActionPlan(careerContextService.buildForCurrentUser());
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeImprovementResult improveResume() {
        getAuthenticatedUser();
        return careerAiProvider.improveResume(careerContextService.buildForCurrentUser());
    }

    @Override
    @Transactional(readOnly = true)
    public CareerRoadmapResult generateRoadmap() {
        getAuthenticatedUser();
        return careerAiProvider.generateCareerRoadmap(careerContextService.buildForCurrentUser());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectRecommendationResult recommendProjects() {
        getAuthenticatedUser();
        return careerAiProvider.recommendProjects(careerContextService.buildForCurrentUser());
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewPreparationResult prepareForInterview() {
        getAuthenticatedUser();
        return careerAiProvider.prepareForInterview(careerContextService.buildForCurrentUser());
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new ResourceNotFoundException("Authenticated user was not found");
        }
        Object principal = authentication.getPrincipal();
        String email = principal instanceof UserDetails userDetails
                ? userDetails.getUsername()
                : principal instanceof String stringPrincipal ? stringPrincipal : null;
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("Authenticated user was not found");
        }
        return currentUserService.getRequiredUser(email);
    }

    private CareerAssistantConversation getOwnedConversation(Long conversationId) {
        if (conversationId == null) {
            throw new ResourceNotFoundException("Conversation was not found");
        }
        User user = getAuthenticatedUser();
        return conversationRepository.findByIdAndUserId(conversationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation was not found with id: " + conversationId));
    }

    private String validateQuestion(String question) {
        if (question == null || question.isBlank()) {
            throw new IllegalArgumentException("Question must not be blank");
        }
        String normalized = question.trim();
        if (normalized.length() > MAX_QUESTION_LENGTH) {
            throw new IllegalArgumentException("Question must not exceed " + MAX_QUESTION_LENGTH + " characters");
        }
        return normalized;
    }

    private CareerAssistantMessage newMessage(
            CareerAssistantConversation conversation,
            CareerAssistantMessage.Role role,
            String content,
            String provider) {
        CareerAssistantMessage message = new CareerAssistantMessage();
        message.setConversation(conversation);
        message.setRole(role);
        message.setContent(content);
        message.setProvider(provider);
        return message;
    }

    private String toTitle(String question) {
        return question.length() <= 200 ? question : question.substring(0, 197) + "...";
    }

    private CareerAssistantConversationResponse toConversationResponse(CareerAssistantConversation conversation) {
        return new CareerAssistantConversationResponse(
                conversation.getId(), conversation.getTitle(), conversation.getCreatedAt(), conversation.getUpdatedAt());
    }

    private CareerAssistantMessageResponse toMessageResponse(CareerAssistantMessage message) {
        return new CareerAssistantMessageResponse(
                message.getId(), message.getRole(), message.getContent(), message.getProvider(), message.getCreatedAt());
    }
}