package com.careerlens.service.impl;

import com.careerlens.ai.context.CareerSkillGap;
import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.dto.SkillGapDTO;
import com.careerlens.entity.JobIntelligenceAnalysis;
import com.careerlens.entity.ResumeAnalysis;
import com.careerlens.entity.User;
import com.careerlens.entity.UserProfile;
import com.careerlens.exception.ResourceNotFoundException;
import com.careerlens.repository.JobIntelligenceRepository;
import com.careerlens.repository.ResumeAnalysisRepository;
import com.careerlens.repository.UserProfileRepository;
import com.careerlens.service.CareerContextService;
import com.careerlens.service.CurrentUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
public class CareerContextServiceImpl implements CareerContextService {

    private static final int MAX_PROFILE_SKILLS = 30;
    private static final int MAX_RESUME_ITEMS = 12;
    private static final int MAX_RESUME_SUGGESTIONS = 12;
    private static final int MAX_JOB_SKILLS = 20;
    private static final int MAX_JOB_GAPS = 12;
    private static final int MAX_BIO_LENGTH = 1000;
    private static final int MAX_ITEM_LENGTH = 1000;

    private final CurrentUserService currentUserService;
    private final UserProfileRepository userProfileRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final JobIntelligenceRepository jobIntelligenceRepository;
    private final ObjectMapper objectMapper;

    public CareerContextServiceImpl(
            CurrentUserService currentUserService,
            UserProfileRepository userProfileRepository,
            ResumeAnalysisRepository resumeAnalysisRepository,
            JobIntelligenceRepository jobIntelligenceRepository,
            ObjectMapper objectMapper) {
        this.currentUserService = currentUserService;
        this.userProfileRepository = userProfileRepository;
        this.resumeAnalysisRepository = resumeAnalysisRepository;
        this.jobIntelligenceRepository = jobIntelligenceRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public UserCareerContext buildForCurrentUser() {
        User user = currentUserService.getRequiredUser(currentUserEmail());
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        ResumeAnalysis resume = resumeAnalysisRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .orElse(null);
        JobIntelligenceAnalysis job = jobIntelligenceRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .findFirst()
                .orElse(null);

        return new UserCareerContext(
                profile == null ? null : cleanText(profile.getCareerGoal(), MAX_ITEM_LENGTH),
                profile == null ? List.of() : limitStrings(profile.getSkills(), MAX_PROFILE_SKILLS),
                profile == null ? null : cleanText(profile.getEducation(), MAX_ITEM_LENGTH),
                profile == null ? null : cleanText(profile.getCollege(), MAX_ITEM_LENGTH),
                profile == null ? null : profile.getGraduationYear(),
                profile == null ? null : cleanText(profile.getBio(), MAX_BIO_LENGTH),
                resume == null ? List.of() : limitStrings(resume.getDetectedSkills(), MAX_RESUME_ITEMS),
                resume == null ? List.of() : limitStrings(resume.getDetectedEducation(), MAX_RESUME_ITEMS),
                resume == null ? List.of() : limitStrings(resume.getDetectedExperience(), MAX_RESUME_ITEMS),
                resume == null ? List.of() : limitStrings(resume.getDetectedProjects(), MAX_RESUME_ITEMS),
                resume == null ? List.of() : limitStrings(resume.getMissingSections(), MAX_RESUME_ITEMS),
                resume == null ? List.of() : limitStrings(resume.getImprovementSuggestions(), MAX_RESUME_SUGGESTIONS),
                job == null ? null : cleanText(job.getJobTitle(), MAX_ITEM_LENGTH),
                job == null ? null : cleanText(job.getCompanyName(), MAX_ITEM_LENGTH),
                job == null ? null : job.getOverallMatchScore(),
                job == null ? List.of() : limitStrings(job.getRequiredSkills(), MAX_JOB_SKILLS),
                job == null ? List.of() : limitStrings(job.getPreferredSkills(), MAX_JOB_SKILLS),
                job == null ? List.of() : limitStrings(job.getMatchedSkills(), MAX_JOB_SKILLS),
                job == null ? List.of() : limitStrings(job.getMissingSkills(), MAX_JOB_SKILLS),
                job == null ? List.of() : readSkillGaps(job.getSkillGapsJson()));
    }

    private String currentUserEmail() {
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
        return email;
    }

    private List<String> limitStrings(List<String> values, int maxItems) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return values.stream()
                .filter(Objects::nonNull)
                .map(value -> cleanText(value, MAX_ITEM_LENGTH))
                .filter(Objects::nonNull)
                .distinct()
                .limit(maxItems)
                .toList();
    }

    private List<CareerSkillGap> readSkillGaps(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        List<CareerSkillGap> gaps = new ArrayList<>();
        for (String value : values) {
            if (gaps.size() == MAX_JOB_GAPS || value == null || value.isBlank()) {
                if (gaps.size() == MAX_JOB_GAPS) {
                    break;
                }
                continue;
            }
            try {
                SkillGapDTO gap = objectMapper.readValue(value, SkillGapDTO.class);
                String skill = cleanText(gap.getSkill(), MAX_ITEM_LENGTH);
                String priority = cleanText(gap.getPriority(), 32);
                String explanation = cleanText(gap.getExplanation(), MAX_ITEM_LENGTH);
                if (skill != null) {
                    gaps.add(new CareerSkillGap(skill, priority, explanation));
                }
            } catch (Exception ignored) {
                // Ignore malformed optional persisted context.
            }
        }
        return List.copyOf(gaps);
    }

    private String cleanText(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength);
    }
}
