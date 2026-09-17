package com.careerlens.service.impl;

import com.careerlens.dto.*;
import com.careerlens.entity.JobIntelligenceAnalysis;
import com.careerlens.entity.ResumeAnalysis;
import com.careerlens.entity.User;
import com.careerlens.entity.UserProfile;
import com.careerlens.exception.ResourceNotFoundException;
import com.careerlens.repository.JobIntelligenceRepository;
import com.careerlens.repository.ResumeAnalysisRepository;
import com.careerlens.repository.UserProfileRepository;
import com.careerlens.service.CurrentUserService;
import com.careerlens.service.JobIntelligenceService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class JobIntelligenceServiceImpl implements JobIntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(JobIntelligenceServiceImpl.class);

    private final JobIntelligenceRepository jobIntelligenceRepository;
    private final UserProfileRepository userProfileRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    // Standard technology skills dictionary
    private static final List<String> DICTIONARY_SKILLS = Arrays.asList(
            "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
            "HTML", "CSS", "SQL", "React", "React Native", "Angular", "Vue.js", "Node.js", "Express.js",
            "Spring", "Spring Boot", "Django", "Flask", "FastAPI", "Next.js", "Tailwind CSS", "Bootstrap",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite", "Oracle",
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "CI/CD",
            "REST API", "GraphQL", "Microservices", "Kafka", "RabbitMQ", "Linux", "Bash",
            "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy",
            "Data Analysis", "Agile", "Scrum", "Jira", "Unit Testing", "JUnit", "Jest", "Cypress"
    );

    public JobIntelligenceServiceImpl(JobIntelligenceRepository jobIntelligenceRepository,
                                      UserProfileRepository userProfileRepository,
                                      ResumeAnalysisRepository resumeAnalysisRepository,
                                      CurrentUserService currentUserService,
                                      ObjectMapper objectMapper) {
        this.jobIntelligenceRepository = jobIntelligenceRepository;
        this.userProfileRepository = userProfileRepository;
        this.resumeAnalysisRepository = resumeAnalysisRepository;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public JobAnalysisResponse analyzeJobDescription(String userEmail, JobAnalysisRequest request) {
        User user = currentUserService.getRequiredUser(userEmail);

        String rawJd = request.getJobDescription();
        String jobTitle = request.getJobTitle();
        if (jobTitle == null || jobTitle.trim().isEmpty()) {
            jobTitle = extractJobTitle(rawJd);
        }

        String companyName = request.getCompanyName();
        if (companyName == null || companyName.trim().isEmpty()) {
            companyName = extractCompanyName(rawJd);
        }

        // Extract skills from JD
        List<String> requiredSkills = extractRequiredSkills(rawJd);
        List<String> preferredSkills = extractPreferredSkills(rawJd, requiredSkills);

        // Fetch user skills from Profile and latest Resume Analysis
        Set<String> userSkills = getUserCandidateSkills(user.getId());

        // Match skills
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingRequiredSkills = new ArrayList<>();
        List<String> missingPreferredSkills = new ArrayList<>();

        for (String req : requiredSkills) {
            if (isSkillMatched(req, userSkills)) {
                matchedSkills.add(req);
            } else {
                missingRequiredSkills.add(req);
            }
        }

        for (String pref : preferredSkills) {
            if (isSkillMatched(pref, userSkills)) {
                if (!matchedSkills.contains(pref)) {
                    matchedSkills.add(pref);
                }
            } else {
                if (!missingPreferredSkills.contains(pref)) {
                    missingPreferredSkills.add(pref);
                }
            }
        }

        List<String> allMissingSkills = new ArrayList<>(missingRequiredSkills);
        allMissingSkills.addAll(missingPreferredSkills);

        // Calculate scores  S = min(100, 0.60*Sreq + 0.25*Spref + 0.15*Sexp)
        int reqScore = requiredSkills.isEmpty() ? 100 : (int) Math.round(
                ((double) (requiredSkills.size() - missingRequiredSkills.size()) / requiredSkills.size()) * 100);
        int prefScore = preferredSkills.isEmpty() ? 100 : (int) Math.round(
                ((double) (preferredSkills.size() - missingPreferredSkills.size()) / preferredSkills.size()) * 100);
        int expScore = evaluateExperienceMatch(rawJd, user.getId());

        int overallScore = (int) Math.min(100, Math.round(0.60 * reqScore + 0.25 * prefScore + 0.15 * expScore));

        // Skill Gaps
        List<SkillGapDTO> skillGaps = generateSkillGaps(missingRequiredSkills, missingPreferredSkills);

        // Career Recommendations
        List<CareerRecommendationDTO> recommendations = generateRecommendations(jobTitle, missingRequiredSkills, missingPreferredSkills);

        // Role-Specific Interview Questions
        List<InterviewQuestionDTO> questions = generateInterviewQuestions(jobTitle, companyName, requiredSkills, matchedSkills, allMissingSkills);

        // Save entity
        JobIntelligenceAnalysis entity = new JobIntelligenceAnalysis();
        entity.setUser(user);
        entity.setJobTitle(jobTitle);
        entity.setCompanyName(companyName);
        entity.setRawJobDescription(rawJd);
        entity.setOverallMatchScore(overallScore);
        entity.setRequiredSkillMatchPercent(reqScore);
        entity.setPreferredSkillMatchPercent(prefScore);
        entity.setRequiredSkills(requiredSkills);
        entity.setPreferredSkills(preferredSkills);
        entity.setMatchedSkills(matchedSkills);
        entity.setMissingSkills(allMissingSkills);
        entity.setSkillGapsJson(serializeList(skillGaps));
        entity.setRecommendationsJson(serializeList(recommendations));
        entity.setQuestionsJson(serializeList(questions));

        JobIntelligenceAnalysis saved = jobIntelligenceRepository.save(entity);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobAnalysisResponse> getAnalysisHistory(String userEmail) {
        User user = currentUserService.getRequiredUser(userEmail);
        List<JobIntelligenceAnalysis> list = jobIntelligenceRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public JobAnalysisResponse getAnalysisById(String userEmail, Long id) {
        User user = currentUserService.getRequiredUser(userEmail);
        JobIntelligenceAnalysis analysis = jobIntelligenceRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Job analysis record not found with id: " + id));
        return mapToResponse(analysis);
    }

    // --- Private Helper Methods ---

    private Set<String> getUserCandidateSkills(Long userId) {
        Set<String> skills = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);

        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(userId);
        profileOpt.ifPresent(p -> {
            if (p.getSkills() != null) {
                skills.addAll(p.getSkills());
            }
        });

        Optional<ResumeAnalysis> resumeOpt = resumeAnalysisRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
        resumeOpt.ifPresent(r -> {
            if (r.getDetectedSkills() != null) {
                skills.addAll(r.getDetectedSkills());
            }
        });

        return skills;
    }

    private boolean isSkillMatched(String skill, Set<String> userSkills) {
        if (userSkills.contains(skill)) {
            return true;
        }
        String lowerSkill = skill.toLowerCase();
        for (String uSkill : userSkills) {
            String lowerU = uSkill.toLowerCase();
            if (lowerU.equals(lowerSkill) || lowerU.contains(lowerSkill) || lowerSkill.contains(lowerU)) {
                return true;
            }
        }
        return false;
    }

    private String extractJobTitle(String text) {
        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty() && trimmed.length() < 80) {
                String lower = trimmed.toLowerCase();
                if (lower.contains("developer") || lower.contains("engineer") || lower.contains("architect") ||
                        lower.contains("analyst") || lower.contains("manager") || lower.contains("lead") ||
                        lower.contains("specialist") || lower.contains("consultant")) {
                    return trimmed.replaceAll("(?i)^(Job Title|Title|Role|Position):?\\s*", "").trim();
                }
            }
        }
        return "Software Professional";
    }

    private String extractCompanyName(String text) {
        Pattern pattern = Pattern.compile(
                "(?:at|with|join|about)\\s+([A-Z][A-Za-z0-9&\\.\\s]{2,30})(?:\\s+is|\\s+we|\\.|\\n|,)",
                Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return "Hiring Company";
    }

    private List<String> extractRequiredSkills(String text) {
        List<String> required = new ArrayList<>();

        // Scan the description while excluding explicit preferred-skill sections.
        String[] lines = text.split("\\r?\\n");
        boolean inPreferred = false;
        for (String line : lines) {
            String trimmedLower = line.trim().toLowerCase();
            if (trimmedLower.contains("preferred") || trimmedLower.contains("nice to have") ||
                    trimmedLower.contains("plus") || trimmedLower.contains("bonus")) {
                inPreferred = true;
                continue;
            }
            if (inPreferred && (trimmedLower.contains("responsibilit") || trimmedLower.contains("require") ||
                    trimmedLower.contains("qualification") || trimmedLower.contains("about us") ||
                    trimmedLower.contains("benefit"))) {
                inPreferred = false;
            }
            if (!inPreferred) {
                for (String s : DICTIONARY_SKILLS) {
                    Pattern pattern = Pattern.compile("\\b" + Pattern.quote(s) + "\\b", Pattern.CASE_INSENSITIVE);
                    if (pattern.matcher(line).find() && !required.contains(s)) {
                        required.add(s);
                    }
                }
            }
        }

        // Boost skills in explicit "Requirements" sections.
        boolean inRequirements = false;
        for (String line : lines) {
            String trimmedLower = line.trim().toLowerCase();
            if (trimmedLower.contains("require") || trimmedLower.contains("must have") ||
                    trimmedLower.contains("qualification") || trimmedLower.contains("what you need")) {
                inRequirements = true;
                continue;
            } else if (inRequirements && (trimmedLower.contains("preferred") || trimmedLower.contains("nice to have") ||
                    trimmedLower.contains("about us") || trimmedLower.contains("benefit"))) {
                inRequirements = false;
            }

            if (inRequirements) {
                for (String s : DICTIONARY_SKILLS) {
                    if (trimmedLower.contains(s.toLowerCase()) && !required.contains(s)) {
                        required.add(s);
                    }
                }
            }
        }

        if (required.isEmpty()) {
            required.addAll(Arrays.asList("Java", "SQL", "Git", "REST API"));
        }

        return required.stream().distinct().limit(10).collect(Collectors.toList());
    }

    private List<String> extractPreferredSkills(String text, List<String> alreadyRequired) {
        List<String> preferred = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        boolean inPreferred = false;

        for (String line : lines) {
            String trimmedLower = line.trim().toLowerCase();
            if (trimmedLower.contains("preferred") || trimmedLower.contains("nice to have") ||
                    trimmedLower.contains("plus") || trimmedLower.contains("bonus")) {
                inPreferred = true;
                continue;
            } else if (inPreferred && (trimmedLower.contains("responsibilit") ||
                    trimmedLower.contains("about us") || trimmedLower.contains("benefit"))) {
                inPreferred = false;
            }

            if (inPreferred) {
                for (String s : DICTIONARY_SKILLS) {
                    if (trimmedLower.contains(s.toLowerCase()) && !preferred.contains(s) && !alreadyRequired.contains(s)) {
                        preferred.add(s);
                    }
                }
            }
        }

        // Fallback: pick dictionary skills found in JD that aren't in required
        if (preferred.isEmpty()) {
            for (String s : DICTIONARY_SKILLS) {
                Pattern pattern = Pattern.compile("\\b" + Pattern.quote(s) + "\\b", Pattern.CASE_INSENSITIVE);
                if (pattern.matcher(text).find() && !alreadyRequired.contains(s)) {
                    preferred.add(s);
                }
            }
        }

        return preferred.stream().distinct().limit(8).collect(Collectors.toList());
    }

    /**
     * Estimate experience match. Uses graduation year from UserProfile to infer years of experience.
     * Falls back to 100% match if no relevant data is available.
     */
    private int evaluateExperienceMatch(String rawJd, Long userId) {
        int jdExpReq = 0;
        Pattern pattern = Pattern.compile("(\\d+)\\+?\\s*(?:years?|yrs?)\\s*(?:of)?\\s*experience", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(rawJd);
        if (matcher.find()) {
            try {
                jdExpReq = Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
                // safe to ignore
            }
        }

        if (jdExpReq == 0) return 100;

        // Infer user experience from graduation year
        int userExpYears = 0;
        Optional<UserProfile> profileOpt = userProfileRepository.findByUserId(userId);
        if (profileOpt.isPresent() && profileOpt.get().getGraduationYear() != null) {
            int gradYear = profileOpt.get().getGraduationYear();
            int currentYear = LocalDate.now().getYear();
            userExpYears = Math.max(0, currentYear - gradYear);
        }

        if (userExpYears >= jdExpReq) {
            return 100;
        } else if (userExpYears == 0) {
            return 50; // no data, neutral score
        } else {
            return Math.max(40, (int) Math.round(((double) userExpYears / jdExpReq) * 100));
        }
    }

    private List<SkillGapDTO> generateSkillGaps(List<String> missingReq, List<String> missingPref) {
        List<SkillGapDTO> gaps = new ArrayList<>();
        for (String skill : missingReq) {
            gaps.add(new SkillGapDTO(skill, "HIGH",
                    "Critical requirement specified in the job posting. Strongly recommended to learn before applying."));
        }
        for (String skill : missingPref) {
            gaps.add(new SkillGapDTO(skill, "MEDIUM",
                    "Preferred skill mentioned. Acquiring this will enhance your competitiveness for this role."));
        }
        if (gaps.isEmpty()) {
            gaps.add(new SkillGapDTO("None", "LOW",
                    "Great match! You meet all extracted technical skill requirements for this position."));
        }
        return gaps;
    }

    private List<CareerRecommendationDTO> generateRecommendations(String jobTitle, List<String> missingReq, List<String> missingPref) {
        List<CareerRecommendationDTO> recs = new ArrayList<>();

        if (!missingReq.isEmpty()) {
            String topSkill = missingReq.get(0);
            recs.add(new CareerRecommendationDTO("LEARNING", "Master " + topSkill + " Core Concepts",
                    "Complete a structured course or hands-on tutorials on " + topSkill + " to bridge your top required skill gap."));
        } else {
            recs.add(new CareerRecommendationDTO("LEARNING", "Advanced " + jobTitle + " Architecture",
                    "Deepen your expertise in cloud-native design, distributed systems, and performance tuning for " + jobTitle + " roles."));
        }

        if (!missingReq.isEmpty() || !missingPref.isEmpty()) {
            List<String> projectSkills = new ArrayList<>(missingReq);
            projectSkills.addAll(missingPref);
            String combinedSkills = projectSkills.stream().limit(3).collect(Collectors.joining(", "));
            recs.add(new CareerRecommendationDTO("PROJECT", "Build a Portfolio Project using " + combinedSkills,
                    "Construct a full-stack or end-to-end application integrating " + combinedSkills + " to showcase direct practical competence."));
        } else {
            recs.add(new CareerRecommendationDTO("PROJECT", "Open Source Contribution",
                    "Contribute to prominent open-source projects relevant to the " + jobTitle + " stack to build high-visibility credentials."));
        }

        recs.add(new CareerRecommendationDTO("PREPARATION", "Role-Specific Technical & System Interview Practice",
                "Practice mock technical interviews focusing on system design, algorithmic efficiency, and live code walkthroughs for " + jobTitle + "."));

        return recs;
    }

    private List<InterviewQuestionDTO> generateInterviewQuestions(String jobTitle, String companyName,
                                                                  List<String> requiredSkills, List<String> matchedSkills,
                                                                  List<String> missingSkills) {
        List<InterviewQuestionDTO> questions = new ArrayList<>();

        String primarySkill = !matchedSkills.isEmpty() ? matchedSkills.get(0)
                : (!requiredSkills.isEmpty() ? requiredSkills.get(0) : "software engineering");
        String gapSkill = !missingSkills.isEmpty() ? missingSkills.get(0) : "distributed systems";

        // Technical questions
        questions.add(new InterviewQuestionDTO(
                "Can you walk us through how you handle state management and performance optimization in " + primarySkill + "?",
                "TECHNICAL",
                "Evaluates hands-on technical depth and real-world experience with the primary required skill."));
        questions.add(new InterviewQuestionDTO(
                "How would you approach learning or implementing " + gapSkill + " in a production environment under tight deadlines?",
                "TECHNICAL",
                "Assesses adaptability, learning speed, and problem-solving capability when facing a skill gap."));

        // Behavioral questions
        questions.add(new InterviewQuestionDTO(
                "Describe a time when you had a technical disagreement with a teammate regarding system design for a " + jobTitle + " project. How did you reach alignment?",
                "BEHAVIORAL",
                "Tests communication, collaboration, constructive conflict resolution, and teamwork."));
        questions.add(new InterviewQuestionDTO(
                "Tell me about a high-stress production issue or bug you encountered. What steps did you take to diagnose and permanently resolve it?",
                "BEHAVIORAL",
                "Assesses resilience, systematic debugging methodology, and composure under pressure."));

        // System design / project
        questions.add(new InterviewQuestionDTO(
                "How would you design a scalable, fault-tolerant system for " + companyName + " that processes thousands of concurrent user requests?",
                "PROJECT",
                "Tests architectural thinking, scalability principles, trade-off analysis, and system design capability."));

        return questions;
    }

    private <T> List<String> serializeList(List<T> items) {
        if (items == null || items.isEmpty()) return new ArrayList<>();
        return items.stream().map(item -> {
            try {
                return objectMapper.writeValueAsString(item);
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize item: {}", item, e);
                return "{}";
            }
        }).collect(Collectors.toList());
    }

    private JobAnalysisResponse mapToResponse(JobIntelligenceAnalysis analysis) {
        List<SkillGapDTO> skillGaps = analysis.getSkillGapsJson().stream().map(json -> {
            try {
                return objectMapper.readValue(json, SkillGapDTO.class);
            } catch (Exception e) {
                log.error("Failed to deserialize SkillGapDTO json", e);
                return new SkillGapDTO("Unknown", "LOW", "Failed to parse gap details.");
            }
        }).collect(Collectors.toList());

        List<CareerRecommendationDTO> recommendations = analysis.getRecommendationsJson().stream().map(json -> {
            try {
                return objectMapper.readValue(json, CareerRecommendationDTO.class);
            } catch (Exception e) {
                log.error("Failed to deserialize CareerRecommendationDTO json", e);
                return new CareerRecommendationDTO("LEARNING", "General Study", "Parse error.");
            }
        }).collect(Collectors.toList());

        List<InterviewQuestionDTO> questions = analysis.getQuestionsJson().stream().map(json -> {
            try {
                return objectMapper.readValue(json, InterviewQuestionDTO.class);
            } catch (Exception e) {
                log.error("Failed to deserialize InterviewQuestionDTO json", e);
                return new InterviewQuestionDTO("Tell me about yourself.", "BEHAVIORAL", "General intro question.");
            }
        }).collect(Collectors.toList());

        return new JobAnalysisResponse(
                analysis.getId(),
                analysis.getJobTitle(),
                analysis.getCompanyName(),
                analysis.getRawJobDescription(),
                analysis.getOverallMatchScore(),
                analysis.getRequiredSkillMatchPercent(),
                analysis.getPreferredSkillMatchPercent(),
                analysis.getRequiredSkills(),
                analysis.getPreferredSkills(),
                analysis.getMatchedSkills(),
                analysis.getMissingSkills(),
                skillGaps,
                recommendations,
                questions,
                analysis.getCreatedAt()
        );
    }
}
