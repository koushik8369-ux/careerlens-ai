package com.careerlens;

import com.careerlens.ai.context.CareerSkillGap;
import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.ai.provider.DeterministicCareerAiProvider;
import com.careerlens.ai.provider.contracts.CareerAssistantAnswer;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.ResumeImprovementResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DeterministicCareerAiProviderTest {

    private DeterministicCareerAiProvider provider;
    private UserCareerContext context;

    @BeforeEach
    void setUp() {
        provider = new DeterministicCareerAiProvider();
        context = new UserCareerContext(
                "Backend Engineer",
                List.of("Java", "SQL"),
                "Computer Science",
                "Example College",
                2027,
                "Building secure services",
                List.of("Java", "Spring Boot"),
                List.of("B.Tech Computer Science"),
                List.of("Built REST APIs"),
                List.of("CareerLens project"),
                List.of("Certifications"),
                List.of("Add measurable impact"),
                "Backend Engineer",
                "Example Company",
                78,
                List.of("Java", "Docker"),
                List.of("Kubernetes"),
                List.of("Java"),
                List.of("Docker", "Kubernetes"),
                List.of(new CareerSkillGap("Docker", "HIGH", "Required gap"),
                        new CareerSkillGap("Kubernetes", "MEDIUM", "Preferred gap")));
    }

    @Test
    void answersCareerQuestionUsingContext() {
        CareerAssistantAnswer answer = provider.answerCareerQuestion(context, "What is my career goal?");

        assertTrue(answer.answer().contains("Backend Engineer"));
        assertFalse(answer.answer().contains("unavailable"));
        assertFalse(answer.followUpSuggestions().isEmpty());
    }

    @Test
    void answersUnknownQuestionWithGeneralGuidance() {
        CareerAssistantAnswer answer = provider.answerCareerQuestion(context, "What should I do next?");

        assertTrue(answer.answer().contains("career goal"));
        assertTrue(answer.answer().contains("skill gaps"));
    }

    @Test
    void producesResumeImprovementGuidance() {
        ResumeImprovementResult result = provider.improveResume(context);

        assertTrue(result.weakAreas().stream().anyMatch(value -> value.contains("Certifications")));
        assertTrue(result.missingContent().stream().anyMatch(value -> value.contains("truthful")));
        assertTrue(result.strongerWordingSuggestions().stream().anyMatch(value -> value.contains("action verbs")));
        assertTrue(result.strongerWordingSuggestions().stream().anyMatch(value -> value.contains("measurable")));
    }

    @Test
    void prioritizesRequiredSkillGapsBeforePreferredGaps() {
        CareerRoadmapResult result = provider.generateCareerRoadmap(context);

        assertTrue(result.stages().get(0).actions().get(0).contains("Docker"));
        assertFalse(result.stages().get(0).actions().get(0).contains("Kubernetes"));
    }

    @Test
    void existingSkillsAreNotTreatedAsMissing() {
        CareerRoadmapResult result = provider.generateCareerRoadmap(context);

        assertFalse(result.stages().stream()
                .flatMap(stage -> stage.skills().stream())
                .anyMatch(skill -> skill.equalsIgnoreCase("Java")));
    }

    @Test
    void producesShortMediumAndLongTermRoadmap() {
        CareerRoadmapResult result = provider.generateCareerRoadmap(context);

        assertEquals(List.of("SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"),
                result.stages().stream().map(stage -> stage.name()).toList());
        assertTrue(result.stages().stream().allMatch(stage -> !stage.actions().isEmpty()));
    }

    @Test
    void projectRecommendationsUseDeterministicSkillMappings() {
        CareerRoadmapResult result = provider.generateCareerRoadmap(context);

        assertTrue(result.stages().get(1).actions().stream()
                .anyMatch(action -> action.contains("Spring Boot REST API") || action.contains("Docker and CI/CD")));
    }

    @Test
    void interviewGuidanceNamesTechnicalBehavioralAndProjectPreparation() {
        CareerAssistantAnswer answer = provider.answerCareerQuestion(context, "How should I prepare for an interview?");

        assertTrue(answer.answer().contains("technical"));
        assertTrue(answer.answer().contains("behavioral"));
        assertTrue(answer.answer().contains("project"));
    }

    @Test
    void roadmapStagesProvideActionPlanHorizons() {
        CareerRoadmapResult result = provider.generateCareerRoadmap(context);

        assertNotNull(result.stages().get(0).objective());
        assertNotNull(result.stages().get(1).objective());
        assertNotNull(result.stages().get(2).objective());
    }

    @Test
    void emptyContextReturnsUsefulNonNullResults() {
        UserCareerContext emptyContext = new UserCareerContext(
                null, List.of(), null, null, null, null, List.of(), List.of(), List.of(), List.of(),
                List.of(), List.of(), null, null, null, List.of(), List.of(), List.of(), List.of(), List.of());

        assertNotNull(provider.answerCareerQuestion(emptyContext, "What should I learn?"));
        assertFalse(provider.improveResume(emptyContext).weakAreas().isEmpty());
        assertEquals(3, provider.generateCareerRoadmap(emptyContext).stages().size());
    }

    @Test
    void repeatedExecutionProducesEquivalentResults() {
        assertEquals(provider.answerCareerQuestion(context, "What are my skill gaps?"),
                provider.answerCareerQuestion(context, "What are my skill gaps?"));
        assertEquals(provider.improveResume(context), provider.improveResume(context));
        assertEquals(provider.generateCareerRoadmap(context), provider.generateCareerRoadmap(context));
    }
}
