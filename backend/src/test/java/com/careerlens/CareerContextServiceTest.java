package com.careerlens;

import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.entity.JobIntelligenceAnalysis;
import com.careerlens.entity.ResumeAnalysis;
import com.careerlens.entity.Role;
import com.careerlens.entity.User;
import com.careerlens.entity.UserProfile;
import com.careerlens.repository.JobIntelligenceRepository;
import com.careerlens.repository.ResumeAnalysisRepository;
import com.careerlens.repository.UserProfileRepository;
import com.careerlens.service.CurrentUserService;
import com.careerlens.service.impl.CareerContextServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CareerContextServiceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private ResumeAnalysisRepository resumeAnalysisRepository;

    @Mock
    private JobIntelligenceRepository jobIntelligenceRepository;

    private CareerContextServiceImpl careerContextService;
    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        careerContextService = new CareerContextServiceImpl(
                currentUserService,
                userProfileRepository,
                resumeAnalysisRepository,
                jobIntelligenceRepository,
                new ObjectMapper());

        authenticatedUser = new User("Owner", "owner@example.com", "hashed-password", Role.USER);
        authenticatedUser.setId(7L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("owner@example.com", null, List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void buildsAuthenticatedContextFromOnlyOwnedLatestStructuredData() throws Exception {
        stubAuthenticatedUser();
        UserProfile profile = new UserProfile();
        profile.setUser(authenticatedUser);
        profile.setCareerGoal("Backend Engineer");
        profile.setEducation("Computer Science");
        profile.setCollege("Example College");
        profile.setGraduationYear(2027);
        profile.setBio("Building secure services");
        profile.setPhone("private-phone");
        profile.setSkills(List.of("Java", "SQL"));

        ResumeAnalysis resume = new ResumeAnalysis();
        resume.setUser(authenticatedUser);
        resume.setRawText("private raw resume text");
        resume.setDetectedSkills(List.of("Java", "Spring Boot"));
        resume.setDetectedEducation(List.of("B.Tech Computer Science"));
        resume.setDetectedExperience(List.of("Built REST APIs"));
        resume.setDetectedProjects(List.of("CareerLens project"));
        resume.setMissingSections(List.of("Certifications"));
        resume.setImprovementSuggestions(List.of("Add measurable impact"));

        JobIntelligenceAnalysis job = new JobIntelligenceAnalysis();
        job.setUser(authenticatedUser);
        job.setJobTitle("Senior Backend Engineer");
        job.setCompanyName("Example Company");
        job.setRawJobDescription("private raw job description");
        job.setOverallMatchScore(78);
        job.setRequiredSkills(List.of("Java", "SQL"));
        job.setPreferredSkills(List.of("Docker"));
        job.setMatchedSkills(List.of("Java"));
        job.setMissingSkills(List.of("Docker"));
        job.setSkillGapsJson(List.of(
                new ObjectMapper().writeValueAsString(
                        new com.careerlens.dto.SkillGapDTO("Docker", "MEDIUM", "Build container skills"))));

        when(userProfileRepository.findByUserId(7L)).thenReturn(Optional.of(profile));
        when(resumeAnalysisRepository.findTopByUserIdOrderByCreatedAtDesc(7L)).thenReturn(Optional.of(resume));
        when(jobIntelligenceRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of(job));

        UserCareerContext context = careerContextService.buildForCurrentUser();

        assertEquals("Backend Engineer", context.getCareerGoal());
        assertEquals(List.of("Java", "SQL"), context.getSkills());
        assertEquals(List.of("Spring Boot"), context.getResumeDetectedSkills().subList(1, 2));
        assertEquals(List.of("B.Tech Computer Science"), context.getResumeEducation());
        assertEquals("Senior Backend Engineer", context.getLatestJobTitle());
        assertEquals("Example Company", context.getLatestJobCompany());
        assertEquals(78, context.getLatestJobOverallScore());
        assertEquals("Docker", context.getLatestJobSkillGaps().get(0).skill());
        assertEquals("MEDIUM", context.getLatestJobSkillGaps().get(0).priority());
        assertFalse(context.getResumeDetectedSkills().contains("private raw resume text"));
        assertFalse(context.getLatestJobMissingSkills().contains("private raw job description"));

        verify(currentUserService).getRequiredUser("owner@example.com");
        verify(userProfileRepository).findByUserId(7L);
        verify(resumeAnalysisRepository).findTopByUserIdOrderByCreatedAtDesc(7L);
        verify(jobIntelligenceRepository).findByUserIdOrderByCreatedAtDesc(7L);
    }

    @Test
    void optionalResumeAndJobDataDoNotPreventContextCreation() {
        stubAuthenticatedUser();
        when(userProfileRepository.findByUserId(7L)).thenReturn(Optional.empty());
        when(resumeAnalysisRepository.findTopByUserIdOrderByCreatedAtDesc(7L)).thenReturn(Optional.empty());
        when(jobIntelligenceRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());

        UserCareerContext context = careerContextService.buildForCurrentUser();

        assertNotNull(context);
        assertTrue(context.getSkills().isEmpty());
        assertTrue(context.getResumeEducation().isEmpty());
        assertTrue(context.getLatestJobRequiredSkills().isEmpty());
        assertEquals(null, context.getCareerGoal());
        assertEquals(null, context.getLatestJobTitle());
    }

    @Test
    void doesNotQueryAnotherUsersData() {
        stubAuthenticatedUser();
        when(userProfileRepository.findByUserId(7L)).thenReturn(Optional.empty());
        when(resumeAnalysisRepository.findTopByUserIdOrderByCreatedAtDesc(7L)).thenReturn(Optional.empty());
        when(jobIntelligenceRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());

        careerContextService.buildForCurrentUser();

        org.mockito.Mockito.verify(userProfileRepository, org.mockito.Mockito.never()).findByUserId(99L);
        org.mockito.Mockito.verify(resumeAnalysisRepository, org.mockito.Mockito.never())
                .findTopByUserIdOrderByCreatedAtDesc(99L);
        org.mockito.Mockito.verify(jobIntelligenceRepository, org.mockito.Mockito.never())
                .findByUserIdOrderByCreatedAtDesc(99L);
    }

    @Test
    void contextDoesNotDeclareRawOrSensitiveFields() {
        List<String> fieldNames = List.of(UserCareerContext.class.getDeclaredFields()).stream()
                .map(field -> field.getName())
                .toList();

        assertFalse(fieldNames.contains("rawText"));
        assertFalse(fieldNames.contains("rawJobDescription"));
        assertFalse(fieldNames.contains("password"));
        assertFalse(fieldNames.contains("token"));
        assertFalse(fieldNames.contains("email"));
        assertFalse(fieldNames.contains("phone"));
    }

    @Test
    void contextAppliesDeterministicCollectionAndTextLimits() {
        stubAuthenticatedUser();
        UserProfile profile = new UserProfile();
        profile.setSkills(new ArrayList<>(java.util.stream.IntStream.range(0, 40)
                .mapToObj(index -> "Skill-" + index)
                .toList()));
        profile.setBio("b".repeat(2_000));

        ResumeAnalysis resume = new ResumeAnalysis();
        resume.setDetectedExperience(new ArrayList<>(java.util.stream.IntStream.range(0, 20)
                .mapToObj(index -> "Experience-" + index)
                .toList()));

        when(userProfileRepository.findByUserId(7L)).thenReturn(Optional.of(profile));
        when(resumeAnalysisRepository.findTopByUserIdOrderByCreatedAtDesc(7L)).thenReturn(Optional.of(resume));
        when(jobIntelligenceRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());

        UserCareerContext context = careerContextService.buildForCurrentUser();

        assertEquals(30, context.getSkills().size());
        assertEquals(12, context.getResumeExperience().size());
        assertEquals(1_000, context.getBio().length());
    }

    @Test
    void unauthenticatedRequestCannotBuildContext() {
        SecurityContextHolder.clearContext();

        assertThrows(RuntimeException.class, () -> careerContextService.buildForCurrentUser());
    }

    private void stubAuthenticatedUser() {
        when(currentUserService.getRequiredUser("owner@example.com")).thenReturn(authenticatedUser);
    }
}
