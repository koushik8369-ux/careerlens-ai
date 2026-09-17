package com.careerlens.service.impl;

import com.careerlens.dto.ResumeAnalysisResponse;
import com.careerlens.entity.ResumeAnalysis;
import com.careerlens.entity.User;
import com.careerlens.exception.ResourceNotFoundException;
import com.careerlens.repository.ResumeAnalysisRepository;
import com.careerlens.service.CurrentUserService;
import com.careerlens.service.DocumentParserService;
import com.careerlens.service.ResumeAnalysisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ResumeAnalysisServiceImpl implements ResumeAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(ResumeAnalysisServiceImpl.class);

    private final DocumentParserService documentParserService;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final CurrentUserService currentUserService;

    // Comprehensive skills dictionary
    private static final List<String> COMMON_SKILLS = Arrays.asList(
            "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
            "HTML", "CSS", "SQL", "React", "React Native", "Angular", "Vue.js", "Node.js", "Express.js",
            "Spring", "Spring Boot", "Django", "Flask", "FastAPI", "Next.js", "Tailwind CSS", "Bootstrap",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite", "Oracle",
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "CI/CD",
            "REST API", "GraphQL", "Microservices", "Kafka", "RabbitMQ", "Linux", "Bash",
            "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy",
            "Data Analysis", "Agile", "Scrum", "Jira", "Unit Testing", "JUnit", "Jest", "Cypress"
    );

    // Job role keyword mapping
    private static final Map<String, List<String>> ROLE_SKILLS_MAP = Map.of(
            "frontend developer", List.of("JavaScript", "TypeScript", "React", "HTML", "CSS", "Tailwind CSS", "Vue.js", "Angular", "REST API", "Git"),
            "backend developer", List.of("Java", "Spring Boot", "Python", "Node.js", "SQL", "PostgreSQL", "MySQL", "REST API", "Microservices", "Docker"),
            "full stack developer", List.of("JavaScript", "TypeScript", "React", "Node.js", "Java", "Spring Boot", "SQL", "HTML", "CSS", "Git", "Docker", "REST API"),
            "data scientist", List.of("Python", "SQL", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Data Analysis"),
            "devops engineer", List.of("Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Bash", "Git", "Terraform", "Python", "Microservices")
    );

    public ResumeAnalysisServiceImpl(DocumentParserService documentParserService,
                                      ResumeAnalysisRepository resumeAnalysisRepository,
                                      CurrentUserService currentUserService) {
        this.documentParserService = documentParserService;
        this.resumeAnalysisRepository = resumeAnalysisRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    @Transactional
    public ResumeAnalysisResponse analyzeResume(String userEmail, MultipartFile file, String targetRole) {
        User user = currentUserService.getRequiredUser(userEmail);
        String extractedText = documentParserService.extractText(file);

        ResumeAnalysis analysis = new ResumeAnalysis();
        analysis.setUser(user);
        analysis.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume");
        analysis.setFileType(file.getContentType());
        analysis.setRawText(extractedText);

        // 1. Detect Skills
        List<String> detectedSkills = extractSkills(extractedText);
        analysis.setDetectedSkills(detectedSkills);

        // 2. Detect Education
        List<String> detectedEducation = extractEducation(extractedText);
        analysis.setDetectedEducation(detectedEducation);

        // 3. Detect Experience
        List<String> detectedExperience = extractExperience(extractedText);
        analysis.setDetectedExperience(detectedExperience);

        // 4. Detect Projects
        List<String> detectedProjects = extractProjects(extractedText);
        analysis.setDetectedProjects(detectedProjects);

        // 5. Detect Missing Sections & Generate Suggestions
        List<String> missingSections = detectMissingSections(extractedText, detectedEducation, detectedExperience, detectedProjects);
        analysis.setMissingSections(missingSections);

        List<String> suggestions = generateSuggestions(extractedText, detectedSkills, missingSections);
        analysis.setImprovementSuggestions(suggestions);

        // 6. Calculate Overall Score
        int overallScore = calculateScore(extractedText, detectedSkills, detectedEducation, detectedExperience, detectedProjects, missingSections);
        analysis.setOverallScore(overallScore);

        // 7. Calculate Job Match if target role provided
        if (targetRole != null && !targetRole.trim().isEmpty()) {
            analysis.setTargetRole(targetRole.trim());
            int matchScore = calculateJobMatch(targetRole.trim(), detectedSkills, extractedText);
            analysis.setMatchScore(matchScore);
        } else {
            analysis.setTargetRole("General Software Engineer");
            analysis.setMatchScore(calculateJobMatch("full stack developer", detectedSkills, extractedText));
        }

        ResumeAnalysis saved = resumeAnalysisRepository.save(analysis);
        return ResumeAnalysisResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeAnalysisResponse> getUserAnalysisHistory(String userEmail) {
        User user = currentUserService.getRequiredUser(userEmail);
        return resumeAnalysisRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(ResumeAnalysisResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeAnalysisResponse getAnalysisById(String userEmail, Long id) {
        User user = currentUserService.getRequiredUser(userEmail);
        ResumeAnalysis analysis = resumeAnalysisRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Resume analysis not found with ID: " + id));
        return ResumeAnalysisResponse.fromEntity(analysis);
    }

    // --- Helper Methods ---

    private List<String> extractSkills(String text) {
        String lowerText = text.toLowerCase();
        List<String> found = new ArrayList<>();
        for (String skill : COMMON_SKILLS) {
            String pattern = "\\b" + Pattern.quote(skill.toLowerCase()) + "\\b";
            if (Pattern.compile(pattern).matcher(lowerText).find()) {
                found.add(skill);
            }
        }
        return found;
    }

    private List<String> extractEducation(String text) {
        List<String> eduList = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        boolean inEdu = false;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            String lower = trimmed.toLowerCase();

            if (lower.contains("education") || lower.contains("academic background")) {
                inEdu = true;
                continue;
            } else if (inEdu && (lower.contains("experience") || lower.contains("projects") || lower.contains("skills"))) {
                inEdu = false;
            }

            if (inEdu || lower.contains("bachelor") || lower.contains("master") || lower.contains("b.tech") ||
                    lower.contains("b.s.") || lower.contains("m.s.") || lower.contains("university") || lower.contains("degree")) {
                if (trimmed.length() > 5 && trimmed.length() < 200 && !eduList.contains(trimmed)) {
                    eduList.add(trimmed);
                }
            }
        }
        if (eduList.isEmpty()) {
            eduList.add("Bachelor of Science / Technology in Computer Science (Inferred)");
        }
        return eduList.stream().distinct().limit(5).collect(Collectors.toList());
    }

    private List<String> extractExperience(String text) {
        List<String> expList = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        boolean inExp = false;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            String lower = trimmed.toLowerCase();

            if (lower.contains("experience") || lower.contains("employment history") || lower.contains("work history")) {
                inExp = true;
                continue;
            } else if (inExp && (lower.contains("education") || lower.contains("projects") || lower.contains("skills"))) {
                inExp = false;
            }

            if (inExp || lower.contains("developer") || lower.contains("engineer") || lower.contains("intern") || lower.contains("analyst")) {
                if (trimmed.length() > 10 && trimmed.length() < 250 && !expList.contains(trimmed)) {
                    expList.add(trimmed);
                }
            }
        }
        return expList.stream().distinct().limit(6).collect(Collectors.toList());
    }

    private List<String> extractProjects(String text) {
        List<String> projList = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        boolean inProj = false;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            String lower = trimmed.toLowerCase();

            if (lower.contains("projects") || lower.contains("personal projects") || lower.contains("key projects")) {
                inProj = true;
                continue;
            } else if (inProj && (lower.contains("education") || lower.contains("experience") || lower.contains("skills"))) {
                inProj = false;
            }

            if (inProj || lower.startsWith("project:") || lower.contains("developed a") || lower.contains("built a")) {
                if (trimmed.length() > 10 && trimmed.length() < 250 && !projList.contains(trimmed)) {
                    projList.add(trimmed);
                }
            }
        }
        return projList.stream().distinct().limit(5).collect(Collectors.toList());
    }

    private List<String> detectMissingSections(String text, List<String> edu, List<String> exp, List<String> proj) {
        String lower = text.toLowerCase();
        List<String> missing = new ArrayList<>();

        if (!lower.contains("contact") && !lower.contains("phone") && !lower.contains("email") && !lower.contains("@")) {
            missing.add("Contact Information (Email / Phone)");
        }
        if (!lower.contains("summary") && !lower.contains("objective") && !lower.contains("about me")) {
            missing.add("Professional Summary / Objective");
        }
        if (edu.isEmpty() || (!lower.contains("education") && !lower.contains("university") && !lower.contains("college"))) {
            missing.add("Education Section");
        }
        if (exp.isEmpty() || (!lower.contains("experience") && !lower.contains("work history"))) {
            missing.add("Work Experience Section");
        }
        if (!lower.contains("skills") && !lower.contains("technologies") && !lower.contains("technical stack")) {
            missing.add("Dedicated Skills Section");
        }
        if (proj.isEmpty() && !lower.contains("projects")) {
            missing.add("Key Projects Section");
        }
        if (!lower.contains("certif") && !lower.contains("license")) {
            missing.add("Certifications / Training");
        }
        return missing;
    }

    private List<String> generateSuggestions(String text, List<String> skills, List<String> missingSections) {
        List<String> suggestions = new ArrayList<>();

        if (!missingSections.isEmpty()) {
            suggestions.add("Add missing sections: " + String.join(", ", missingSections) + " to ensure standard ATS readability.");
        }
        if (skills.size() < 5) {
            suggestions.add("Include more relevant technical skills and tools (currently detected " + skills.size() + ").");
        }
        if (!text.matches(".*\\b(quantified|increased|reduced|achieved|improved|managed|led|developed|engineered|scaled)\\b.*")) {
            suggestions.add("Use strong action verbs (e.g., Engineered, Spearheaded, Accelerated, Reduced) to detail your impact.");
        }
        if (!text.matches(".*\\d+%.*") && !text.matches(".*\\$\\d+.*") && !text.matches(".*\\b\\d+ (users|clients|projects|team)\\b.*")) {
            suggestions.add("Quantify your achievements with concrete metrics (e.g., 'Improved API latency by 45%', 'Managed 5+ engineers').");
        }
        if (text.length() < 500) {
            suggestions.add("Your resume text appears concise. Ensure you elaborate on key achievements and technical responsibilities.");
        } else if (text.length() > 5000) {
            suggestions.add("Your resume text is quite lengthy. Consider condensing content to 1-2 focused pages for maximum recruiter engagement.");
        }
        if (!text.contains("linkedin.com") && !text.contains("github.com")) {
            suggestions.add("Add hyperlinks to your LinkedIn profile and GitHub portfolio in the header.");
        }

        return suggestions;
    }

    private int calculateScore(String text, List<String> skills, List<String> edu, List<String> exp, List<String> proj, List<String> missing) {
        int score = 50; // Base score

        // Presence of sections (+30 max)
        score += Math.max(0, (7 - missing.size()) * 4);

        // Skills (+10 max)
        score += Math.min(10, skills.size());

        // Impact & Metrics (+10 max)
        if (text.matches(".*\\d+%.*")) score += 3;
        if (text.contains("github.com") || text.contains("linkedin.com")) score += 3;
        if (text.toLowerCase().contains("built") || text.toLowerCase().contains("designed") || text.toLowerCase().contains("led")) score += 4;

        return Math.min(98, Math.max(35, score));
    }

    private int calculateJobMatch(String role, List<String> detectedSkills, String text) {
        String normalizedRole = role.toLowerCase().trim();
        List<String> targetSkills = ROLE_SKILLS_MAP.getOrDefault(normalizedRole,
                Arrays.asList("Java", "JavaScript", "Python", "SQL", "Git", "REST API", "Docker", "React"));

        long matchedCount = targetSkills.stream()
                .filter(skill -> detectedSkills.stream().anyMatch(s -> s.equalsIgnoreCase(skill)) || text.toLowerCase().contains(skill.toLowerCase()))
                .count();

        double ratio = (double) matchedCount / targetSkills.size();
        int matchPercentage = (int) Math.round(ratio * 100);
        return Math.min(95, Math.max(40, matchPercentage + 15));
    }
}
