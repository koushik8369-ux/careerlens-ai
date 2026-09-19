package com.careerlens.service;

import com.careerlens.dto.CareerAssistantConversationResponse;
import com.careerlens.dto.CareerAssistantMessageResponse;
import com.careerlens.ai.provider.contracts.CareerActionPlanResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.InterviewPreparationResult;
import com.careerlens.ai.provider.contracts.ProjectRecommendationResult;
import com.careerlens.ai.provider.contracts.ResumeImprovementResult;

import java.util.List;

public interface CareerAssistantService {

    CareerAssistantConversationResponse createConversation();

    List<CareerAssistantConversationResponse> getUserConversations();

    List<CareerAssistantMessageResponse> getConversationMessages(Long conversationId);

    CareerAssistantMessageResponse sendMessage(Long conversationId, String question);

    CareerActionPlanResult generateActionPlan();

    ResumeImprovementResult improveResume();

    CareerRoadmapResult generateRoadmap();

    ProjectRecommendationResult recommendProjects();

    InterviewPreparationResult prepareForInterview();
}