package com.careerlens.ai.provider.contracts;

import java.util.List;

public record InterviewPreparationResult(
        List<String> technicalTopics,
        List<String> behavioralQuestions,
        List<String> projectTalkingPoints) {

    public InterviewPreparationResult {
        technicalTopics = List.copyOf(technicalTopics);
        behavioralQuestions = List.copyOf(behavioralQuestions);
        projectTalkingPoints = List.copyOf(projectTalkingPoints);
    }
}