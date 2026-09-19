package com.careerlens.ai.provider;

import com.careerlens.ai.context.UserCareerContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CareerAiPromptBuilder {

    private final ObjectMapper objectMapper;

    public CareerAiPromptBuilder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String systemPrompt(String outputShape) {
        return "You are CareerLens AI, a concise career guidance assistant. "
                + "Use only the supplied CareerContext. Never invent user facts. "
                + "Clearly distinguish known information from recommendations. "
                + "Return one JSON object with exactly this shape: " + outputShape;
    }

    public String contextPrompt(UserCareerContext context) {
        UserCareerContext safeContext = context == null ? emptyContext() : context;
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("careerGoal", safeContext.getCareerGoal());
        values.put("skills", safeContext.getSkills());
        values.put("education", safeContext.getEducation());
        values.put("college", safeContext.getCollege());
        values.put("graduationYear", safeContext.getGraduationYear());
        values.put("bio", safeContext.getBio());
        values.put("resumeDetectedSkills", safeContext.getResumeDetectedSkills());
        values.put("resumeEducation", safeContext.getResumeEducation());
        values.put("resumeExperience", safeContext.getResumeExperience());
        values.put("resumeProjects", safeContext.getResumeProjects());
        values.put("resumeMissingSections", safeContext.getResumeMissingSections());
        values.put("resumeSuggestions", safeContext.getResumeSuggestions());
        values.put("latestJobTitle", safeContext.getLatestJobTitle());
        values.put("latestJobCompany", safeContext.getLatestJobCompany());
        values.put("latestJobOverallScore", safeContext.getLatestJobOverallScore());
        values.put("latestJobRequiredSkills", safeContext.getLatestJobRequiredSkills());
        values.put("latestJobPreferredSkills", safeContext.getLatestJobPreferredSkills());
        values.put("latestJobMatchedSkills", safeContext.getLatestJobMatchedSkills());
        values.put("latestJobMissingSkills", safeContext.getLatestJobMissingSkills());
        values.put("latestJobSkillGaps", safeContext.getLatestJobSkillGaps());
        try {
            return objectMapper.writeValueAsString(values);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Career context could not be serialized", exception);
        }
    }

    public String questionPrompt(UserCareerContext context, String question) {
        return "CareerContext: " + contextPrompt(context) + "\nQuestion: " + safe(question);
    }

    public String contextTaskPrompt(UserCareerContext context, String task) {
        return "CareerContext: " + contextPrompt(context) + "\nTask: " + task;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private UserCareerContext emptyContext() {
        return new UserCareerContext(null, List.of(), null, null, null, null, List.of(), List.of(), List.of(),
                List.of(), List.of(), List.of(), null, null, null, List.of(), List.of(), List.of(), List.of(), List.of());
    }
}