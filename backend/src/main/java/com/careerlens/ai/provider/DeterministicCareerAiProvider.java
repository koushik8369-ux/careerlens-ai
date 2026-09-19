package com.careerlens.ai.provider;

import com.careerlens.ai.context.CareerSkillGap;
import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.ai.provider.contracts.CareerAssistantAnswer;
import com.careerlens.ai.provider.contracts.CareerActionPlanResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapStage;
import com.careerlens.ai.provider.contracts.InterviewPreparationResult;
import com.careerlens.ai.provider.contracts.ProjectRecommendation;
import com.careerlens.ai.provider.contracts.ProjectRecommendationResult;
import com.careerlens.ai.provider.contracts.ResumeImprovementResult;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "deterministic", matchIfMissing = true)
public class DeterministicCareerAiProvider implements CareerAiProvider {

    @Override
    public CareerAssistantAnswer answerCareerQuestion(UserCareerContext context, String question) {
        UserCareerContext safeContext = context == null ? emptyContext() : context;
        String normalizedQuestion = normalize(question);

        if (containsAny(normalizedQuestion, "career goal", "career path", "target role", "goal")) {
            return answerCareerGoal(safeContext);
        }
        if (containsAny(normalizedQuestion, "skill gap", "skill gaps", "missing skill", "should i learn")) {
            return answerSkillGaps(safeContext);
        }
        if (containsAny(normalizedQuestion, "skill", "technology", "technologies", "stack")) {
            return answerSkills(safeContext);
        }
        if (containsAny(normalizedQuestion, "resume", "cv", "curriculum")) {
            return answerResume(safeContext);
        }
        if (containsAny(normalizedQuestion, "project", "portfolio")) {
            return answerProjects(safeContext);
        }
        if (containsAny(normalizedQuestion, "interview", "interviewing")) {
            return answerInterview(safeContext);
        }
        if (containsAny(normalizedQuestion, "roadmap", "learn next", "learning plan")) {
            return answerRoadmap(safeContext);
        }
        if (containsAny(normalizedQuestion, "job match", "job matching", "match", "job requirement", "position")) {
            return answerJobMatching(safeContext);
        }
        return new CareerAssistantAnswer(
                "Focus on your stated career goal, strengthen the most relevant skill gaps, and "
                        + "support your profile with truthful resume evidence and practical projects. "
                        + missingInformation(safeContext),
                List.of("What is my career goal?", "Which skills should I improve next?", "How can I improve my resume?"));
    }

    @Override
    public CareerActionPlanResult generateActionPlan(UserCareerContext context) {
        UserCareerContext safeContext = context == null ? emptyContext() : context;
        List<String> actions = new ArrayList<>();
        Set<String> existingSkills = normalizedSkillSet(safeContext);
        List<String> skillGaps = filteredMissingSkills(safeContext.getLatestJobRequiredSkills(), existingSkills);
        skillGaps = mergeDistinct(skillGaps,
                filteredMissingSkills(safeContext.getLatestJobPreferredSkills(), existingSkills));
        if (!skillGaps.isEmpty()) {
            actions.add("Prioritize practice for these role-relevant skill gaps: " + join(skillGaps) + ".");
        }
        if (!safeContext.getResumeMissingSections().isEmpty()) {
            actions.add("Address the structured resume gaps: " + join(safeContext.getResumeMissingSections()) + ".");
        }
        if (safeContext.getResumeProjects().isEmpty()) {
            actions.add("Build one small project aligned with your career direction and document the decisions and truthful outcome.");
        }
        if (actions.isEmpty()) {
            actions.add("Confirm your target role and choose one measurable skill or outcome to improve this week.");
            actions.add("Document evidence of your current skills through a truthful project, resume entry, or work example.");
        }
        return new CareerActionPlanResult(distinct(actions));
    }

    @Override
    public ResumeImprovementResult improveResume(UserCareerContext context) {
        UserCareerContext safeContext = context == null ? emptyContext() : context;
        List<String> weakAreas = new ArrayList<>();
        List<String> missingContent = new ArrayList<>();
        List<String> wordingSuggestions = new ArrayList<>();

        if (safeContext.getResumeMissingSections().isEmpty()
                && safeContext.getResumeExperience().isEmpty()
                && safeContext.getResumeProjects().isEmpty()
                && safeContext.getResumeDetectedSkills().isEmpty()) {
            weakAreas.add("No structured resume analysis is available yet.");
            missingContent.add("Provide a resume analysis before tailoring detailed section feedback.");
        }
        for (String section : safeContext.getResumeMissingSections()) {
            weakAreas.add("Missing or underrepresented section: " + section + ".");
            missingContent.add("Add a truthful " + section + " section where it reflects your background.");
        }
        if (safeContext.getResumeExperience().isEmpty()) {
            weakAreas.add("Experience evidence is limited in the structured resume data.");
            missingContent.add("Add relevant responsibilities, outcomes, or coursework that accurately represent your experience.");
        }
        if (safeContext.getResumeProjects().isEmpty()) {
            weakAreas.add("Project evidence is limited in the structured resume data.");
            missingContent.add("Add one or more truthful projects with the problem, technologies, and outcome.");
        }
        if (safeContext.getResumeDetectedSkills().isEmpty() && safeContext.getSkills().isEmpty()) {
            weakAreas.add("Few skills are available for role alignment.");
            missingContent.add("Add skills that you can genuinely explain and demonstrate.");
        }

        wordingSuggestions.addAll(safeContext.getResumeSuggestions());
        wordingSuggestions.add("Use precise action verbs such as built, designed, improved, tested, or automated when they accurately describe your work.");
        wordingSuggestions.add("Add measurable impact where you have real evidence, such as time saved, scale handled, defects reduced, or users supported.");
        wordingSuggestions.add("Treat suggested wording as a template and verify every claim against your actual experience.");
        if (safeContext.getCareerGoal() != null) {
            wordingSuggestions.add("Prioritize wording and evidence that support the career goal: " + safeContext.getCareerGoal() + ".");
        }

        return new ResumeImprovementResult(
                distinct(weakAreas),
                distinct(missingContent),
                distinct(wordingSuggestions));
    }

    @Override
    public CareerRoadmapResult generateCareerRoadmap(UserCareerContext context) {
        UserCareerContext safeContext = context == null ? emptyContext() : context;
        Set<String> existingSkills = normalizedSkillSet(safeContext);
        List<String> requiredGaps = filteredMissingSkills(safeContext.getLatestJobRequiredSkills(), existingSkills);
        List<String> preferredGaps = filteredMissingSkills(safeContext.getLatestJobPreferredSkills(), existingSkills);
        if (requiredGaps.isEmpty() && preferredGaps.isEmpty()) {
            requiredGaps = filteredMissingSkills(safeContext.getLatestJobMissingSkills(), existingSkills);
        }

        List<String> shortTermActions = new ArrayList<>();
        List<String> shortTermSkills = new ArrayList<>(requiredGaps);
        if (!requiredGaps.isEmpty()) {
            shortTermActions.add("Build foundational competence in the required gaps: " + join(requiredGaps) + ".");
        }
        if (!safeContext.getResumeMissingSections().isEmpty()) {
            shortTermActions.add("Address resume gaps: " + join(safeContext.getResumeMissingSections()) + ".");
        }
        if (shortTermActions.isEmpty()) {
            shortTermActions.add("Confirm your career goal and document the skills and evidence you already have.");
        }

        List<String> mediumTermActions = new ArrayList<>();
        List<String> mediumTermSkills = new ArrayList<>(preferredGaps);
        List<String> projectSkills = mergeDistinct(requiredGaps, preferredGaps);
        if (!projectSkills.isEmpty()) {
            for (String skill : projectSkills.stream().limit(3).toList()) {
                mediumTermActions.add(projectFor(skill));
            }
            mediumTermSkills.addAll(projectSkills);
        } else if (safeContext.getResumeProjects().isEmpty()) {
            mediumTermActions.add("Build a small portfolio project aligned with the stated career goal and document the decisions made.");
        } else {
            mediumTermActions.add("Extend an existing project with measurable improvements and clear portfolio documentation.");
        }
        if (!safeContext.getResumeSuggestions().isEmpty()) {
            mediumTermActions.add("Apply the available resume improvement suggestions after verifying them against your evidence.");
        }

        List<String> longTermActions = new ArrayList<>();
        List<String> longTermSkills = new ArrayList<>();
        longTermActions.add("Review progress against the career goal and refresh the roadmap using new evidence.");
        if (safeContext.getLatestJobTitle() != null) {
            longTermActions.add("Reassess readiness for " + safeContext.getLatestJobTitle() + " using the next job analysis.");
        } else {
            longTermActions.add("Compare your profile with a target role when a job analysis is available.");
        }
        if (!safeContext.getLatestJobSkillGaps().isEmpty()) {
            longTermActions.add("Revisit remaining prioritized skill gaps after completing the foundational and project work.");
        }

        String goal = safeContext.getCareerGoal() == null ? "your target career direction" : safeContext.getCareerGoal();
        return new CareerRoadmapResult(List.of(
                new CareerRoadmapStage("SHORT_TERM", "Establish the foundations for " + goal + ".", distinct(shortTermActions), distinct(shortTermSkills)),
                new CareerRoadmapStage("MEDIUM_TERM", "Create evidence of applied ability for " + goal + ".", distinct(mediumTermActions), distinct(mediumTermSkills)),
                new CareerRoadmapStage("LONG_TERM", "Sustain progress toward " + goal + ".", distinct(longTermActions), distinct(longTermSkills))));
    }

    @Override
    public ProjectRecommendationResult recommendProjects(UserCareerContext context) {
        UserCareerContext safeContext = context == null ? emptyContext() : context;
        Set<String> existingSkills = normalizedSkillSet(safeContext);
        List<String> gaps = filteredMissingSkills(safeContext.getLatestJobRequiredSkills(), existingSkills);
        gaps = mergeDistinct(gaps, filteredMissingSkills(safeContext.getLatestJobPreferredSkills(), existingSkills));
        if (gaps.isEmpty()) {
            gaps = filteredMissingSkills(safeContext.getLatestJobMissingSkills(), existingSkills);
        }

        List<ProjectRecommendation> recommendations = new ArrayList<>();
        for (String skill : gaps.stream().limit(3).toList()) {
            recommendations.add(new ProjectRecommendation(
                    projectFor(skill),
                    "Create a focused, truthful project with documented decisions, implementation details, and measurable outcomes.",
                    List.of(skill),
                    "This project addresses an unaddressed skill in the available job context."));
        }
        if (recommendations.isEmpty()) {
            String goal = safeContext.getCareerGoal() == null ? "your target career direction" : safeContext.getCareerGoal();
            recommendations.add(new ProjectRecommendation(
                    "Build a portfolio project aligned with " + goal + ".",
                    "Choose a small problem, implement it end to end, and document the problem, your contribution, technologies, and truthful outcome.",
                    mergedSkills(safeContext),
                    "No unaddressed job skills are available, so the recommendation establishes evidence for your career direction."));
        }
        return new ProjectRecommendationResult(recommendations);
    }

        @Override
        public InterviewPreparationResult prepareForInterview(UserCareerContext context) {
        UserCareerContext safeContext = context == null ? emptyContext() : context;
        String role = safeContext.getLatestJobTitle() == null
            ? safeContext.getCareerGoal() == null ? "your target role" : safeContext.getCareerGoal()
            : safeContext.getLatestJobTitle();

        List<String> technicalTopics = safeContext.getLatestJobRequiredSkills().isEmpty()
            ? mergedSkills(safeContext)
            : distinct(safeContext.getLatestJobRequiredSkills());
        if (technicalTopics.isEmpty()) {
            technicalTopics = List.of("Review the fundamentals most relevant to " + role + ".");
        }

        List<String> behavioralQuestions = List.of(
            "Describe a challenging problem you solved and how you approached it.",
            "Tell me about a time you received difficult feedback and what you changed.",
            "Why are you interested in " + role + "?");

        List<String> projectTalkingPoints = safeContext.getResumeProjects().stream()
            .filter(project -> project != null && !project.isBlank())
            .map(project -> "Explain the problem, your contribution, technical decisions, and truthful outcome for: " + project + ".")
            .toList();
        if (projectTalkingPoints.isEmpty()) {
            projectTalkingPoints = List.of(
                "Prepare one concise project walkthrough covering the problem, your contribution, technical decisions, and outcome.");
        }

        return new InterviewPreparationResult(technicalTopics, behavioralQuestions, projectTalkingPoints);
        }

    private CareerAssistantAnswer answerCareerGoal(UserCareerContext context) {
        String goal = context.getCareerGoal();
        String answer = goal == null
                ? "No career goal is saved yet. Define a target role or direction so skills, projects, and resume choices can be prioritized."
                : "Your saved career goal is " + goal + ". Use it as the filter for choosing skills, projects, and job requirements.";
        return followUp(context, answer, "Which skills support this goal?", "What should I do next?");
    }

    private CareerAssistantAnswer answerSkills(UserCareerContext context) {
        List<String> skills = mergedSkills(context);
        String answer = skills.isEmpty()
                ? "No structured skills are available yet. Add profile skills or complete a resume analysis to identify your current baseline."
                : "Your structured skill baseline includes: " + join(skills) + ". Prioritize skills that appear in your target job requirements.";
        return followUp(context, answer, "Which skills are gaps?", "How should I present these skills on my resume?");
    }

    private CareerAssistantAnswer answerSkillGaps(UserCareerContext context) {
        List<String> gaps = filteredMissingSkills(context.getLatestJobMissingSkills(), normalizedSkillSet(context));
        if (gaps.isEmpty()) {
            return followUp(context, "No unaddressed job skill gaps are available in the current context. Add a job analysis to receive role-specific gap guidance.", "How can I improve my resume?");
        }
        return followUp(context, "The current unaddressed job skill gaps are: " + join(gaps) + ". Start with required skills, then validate progress through a practical project.", "Which gap should I prioritize?");
    }

    private CareerAssistantAnswer answerResume(UserCareerContext context) {
        String answer = context.getResumeMissingSections().isEmpty() && context.getResumeSuggestions().isEmpty()
                ? "No specific resume gaps or suggestions are available in the current structured context. Keep claims truthful and connect each bullet to evidence."
                : "Resume focus areas: missing sections " + joinOrNone(context.getResumeMissingSections())
                        + "; existing suggestions " + joinOrNone(context.getResumeSuggestions()) + ".";
        return followUp(context, answer, "Suggest stronger wording", "What content is missing?");
    }

    private CareerAssistantAnswer answerProjects(UserCareerContext context) {
        if (!context.getResumeProjects().isEmpty()) {
            return followUp(context, "The structured context includes these projects: " + join(context.getResumeProjects()) + ". Strengthen them by documenting the problem, your contribution, technologies, and truthful outcomes.", "Which skill gap can my projects address?");
        }
        return followUp(context, "No projects are available in the structured context. Build a small project aligned with your career goal and a verified skill gap, then document the work honestly.", "What project should I build next?");
    }

    private CareerAssistantAnswer answerInterview(UserCareerContext context) {
        String role = context.getLatestJobTitle() == null ? "your target role" : context.getLatestJobTitle();
        String skills = joinOrNone(context.getLatestJobRequiredSkills());
        return followUp(context, "For " + role + ", prepare technical explanations for these requirements: " + skills
                        + ". Also prepare truthful behavioral examples and project walkthroughs; do not claim experience that is not in your evidence.", "Give me a technical practice plan.");
    }

    private CareerAssistantAnswer answerRoadmap(UserCareerContext context) {
        CareerRoadmapResult roadmap = generateCareerRoadmap(context);
        String stages = roadmap.stages().stream().map(CareerRoadmapStage::name).collect(Collectors.joining(", "));
        return followUp(context, "A deterministic roadmap is organized into: " + stages + ". Start with the short-term actions, then use projects to demonstrate applied skills.", "What should I do this week?");
    }

    private CareerAssistantAnswer answerJobMatching(UserCareerContext context) {
        if (context.getLatestJobTitle() == null) {
            return followUp(context, "No job analysis is available yet. Analyze a target job to compare its requirements with your structured skills.", "Which skills should I improve?");
        }
        String score = context.getLatestJobOverallScore() == null ? "an unrecorded" : context.getLatestJobOverallScore().toString();
        return followUp(context, "The latest analyzed role is " + context.getLatestJobTitle() + " with a recorded match score of " + score
                        + ". Review matched skills and close the unaddressed requirements before presenting yourself for the role.", "What are my remaining skill gaps?");
    }

    private CareerAssistantAnswer followUp(UserCareerContext context, String answer, String... suggestions) {
        return new CareerAssistantAnswer(answer + " " + missingInformation(context), List.of(suggestions));
    }

    private String missingInformation(UserCareerContext context) {
        List<String> missing = new ArrayList<>();
        if (context.getCareerGoal() == null) missing.add("career goal");
        if (mergedSkills(context).isEmpty()) missing.add("skills");
        if (context.getResumeDetectedSkills().isEmpty() && context.getResumeExperience().isEmpty()
                && context.getResumeProjects().isEmpty()) missing.add("resume analysis");
        if (context.getLatestJobTitle() == null) missing.add("job analysis");
        return missing.isEmpty() ? "" : "Available context is missing: " + join(missing) + ".";
    }

    private UserCareerContext emptyContext() {
        return new UserCareerContext(null, List.of(), null, null, null, null, List.of(), List.of(), List.of(),
                List.of(), List.of(), List.of(), null, null, null, List.of(), List.of(), List.of(), List.of(), List.of());
    }

    private Set<String> normalizedSkillSet(UserCareerContext context) {
        return mergedSkills(context).stream()
                .map(this::normalize)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private List<String> mergedSkills(UserCareerContext context) {
        Map<String, String> skills = new LinkedHashMap<>();
        for (String skill : concat(context.getSkills(), context.getResumeDetectedSkills())) {
            if (skill != null && !skill.isBlank()) {
                skills.putIfAbsent(normalize(skill), skill.trim());
            }
        }
        return new ArrayList<>(skills.values());
    }

    private List<String> filteredMissingSkills(List<String> skills, Set<String> existingSkills) {
        return skills.stream()
                .filter(skill -> skill != null && !skill.isBlank())
                .filter(skill -> !existingSkills.contains(normalize(skill)))
                .map(String::trim)
                .distinct()
                .toList();
    }

    private List<String> mergeDistinct(List<String> first, List<String> second) {
        return new ArrayList<>(new LinkedHashSet<>(concat(first, second)));
    }

    private List<String> concat(List<String> first, List<String> second) {
        List<String> result = new ArrayList<>();
        if (first != null) result.addAll(first);
        if (second != null) result.addAll(second);
        return result;
    }

    private String projectFor(String skill) {
        String normalized = normalize(skill);
        if (normalized.contains("java") || normalized.contains("spring")) {
            return "Build a Spring Boot REST API project that demonstrates " + skill + ".";
        }
        if (normalized.contains("react")) {
            return "Build a React or full-stack dashboard that demonstrates " + skill + ".";
        }
        if (normalized.contains("sql") || normalized.contains("database") || normalized.contains("mysql")
                || normalized.contains("postgres")) {
            return "Build a database management application that demonstrates " + skill + ".";
        }
        if (normalized.contains("ai") || normalized.contains("machine learning") || normalized.contains("ml")) {
            return "Build a small machine-learning or AI application that demonstrates " + skill + ".";
        }
        if (normalized.contains("devops") || normalized.contains("docker") || normalized.contains("ci/cd")
                || normalized.contains("kubernetes")) {
            return "Build a Docker and CI/CD project that demonstrates " + skill + ".";
        }
        return "Build a focused portfolio project that demonstrates " + skill + " in a truthful, measurable way.";
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) return true;
        }
        return false;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String join(List<String> values) {
        return values.stream().filter(value -> value != null && !value.isBlank()).collect(Collectors.joining(", "));
    }

    private String joinOrNone(List<String> values) {
        return values.isEmpty() ? "none recorded" : join(values);
    }

    private List<String> distinct(List<String> values) {
        return values.stream().filter(value -> value != null && !value.isBlank()).distinct().toList();
    }
}
