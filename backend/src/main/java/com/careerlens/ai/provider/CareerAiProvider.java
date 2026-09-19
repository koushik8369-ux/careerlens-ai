package com.careerlens.ai.provider;

import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.ai.provider.contracts.CareerAssistantAnswer;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.InterviewPreparationResult;
import com.careerlens.ai.provider.contracts.ProjectRecommendationResult;
import com.careerlens.ai.provider.contracts.ResumeImprovementResult;

public interface CareerAiProvider {

    CareerAssistantAnswer answerCareerQuestion(UserCareerContext context, String question);

    ResumeImprovementResult improveResume(UserCareerContext context);

    CareerRoadmapResult generateCareerRoadmap(UserCareerContext context);

    ProjectRecommendationResult recommendProjects(UserCareerContext context);

    InterviewPreparationResult prepareForInterview(UserCareerContext context);
}
