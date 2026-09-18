package com.careerlens;

import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.ai.provider.CareerAiProvider;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapStage;
import com.careerlens.entity.CareerPlan;
import com.careerlens.entity.CareerPlanItem;
import com.careerlens.entity.JobIntelligenceAnalysis;
import com.careerlens.entity.ResumeAnalysis;
import com.careerlens.entity.Role;
import com.careerlens.entity.User;
import com.careerlens.repository.CareerPlanItemRepository;
import com.careerlens.repository.CareerPlanRepository;
import com.careerlens.repository.JobIntelligenceRepository;
import com.careerlens.repository.ResumeAnalysisRepository;
import com.careerlens.service.CareerContextService;
import com.careerlens.service.CurrentUserService;
import com.careerlens.service.impl.CareerPlanServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CareerPlanServiceTest {

    @Mock private CurrentUserService currentUserService;
    @Mock private CareerContextService careerContextService;
    @Mock private CareerAiProvider careerAiProvider;
    @Mock private CareerPlanRepository careerPlanRepository;
    @Mock private CareerPlanItemRepository careerPlanItemRepository;
    @Mock private ResumeAnalysisRepository resumeAnalysisRepository;
    @Mock private JobIntelligenceRepository jobIntelligenceRepository;

    private CareerPlanServiceImpl service;
    private User authenticatedUser;
    private UserCareerContext context;
    private CareerRoadmapResult roadmap;

    @BeforeEach
    void setUp() {
        service = new CareerPlanServiceImpl(
                currentUserService, careerContextService, careerAiProvider, careerPlanRepository,
                careerPlanItemRepository, resumeAnalysisRepository, jobIntelligenceRepository);
        authenticatedUser = new User("Owner", "owner@example.com", "hashed-password", Role.USER);
        authenticatedUser.setId(7L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("owner@example.com", null, List.of()));
        when(currentUserService.getRequiredUser("owner@example.com")).thenReturn(authenticatedUser);
        context = new UserCareerContext(
                "Backend Engineer", List.of("Java"), null, null, null, null, List.of(), List.of(), List.of(),
                List.of(), List.of(), List.of(), "Backend Engineer", null, null, List.of("Java", "Docker"),
                List.of("Kubernetes"), List.of("Java"), List.of("Docker", "Kubernetes"), List.of());
        roadmap = new CareerRoadmapResult(List.of(
                new CareerRoadmapStage("SHORT_TERM", "Build foundations.",
                        List.of("Learn Docker", "Update resume evidence"), List.of("Docker")),
                new CareerRoadmapStage("MEDIUM_TERM", "Build applied evidence.",
                        List.of("Build a Docker project"), List.of("Docker", "Kubernetes")),
                new CareerRoadmapStage("LONG_TERM", "Sustain progress.",
                        List.of("Prepare for interview"), List.of("Kubernetes"))));
        lenient().when(careerContextService.buildForCurrentUser()).thenReturn(context);
        lenient().when(careerAiProvider.generateCareerRoadmap(context)).thenReturn(roadmap);
        lenient().when(careerPlanRepository.findFirstByUserIdAndStatusOrderByUpdatedAtDesc(7L, CareerPlan.Status.ACTIVE))
                .thenReturn(Optional.empty());
        lenient().when(careerPlanRepository.save(any(CareerPlan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatedUserGeneratesPlanFromDeterministicProviderAndLatestSources() {
        ResumeAnalysis resume = new ResumeAnalysis();
        resume.setId(11L);
        JobIntelligenceAnalysis job = new JobIntelligenceAnalysis();
        job.setId(22L);
        when(resumeAnalysisRepository.findTopByUserIdOrderByCreatedAtDesc(7L)).thenReturn(Optional.of(resume));
        when(jobIntelligenceRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of(job));

        var response = service.generateCareerPlan();

        assertEquals("Backend Engineer", response.careerGoal());
        assertEquals(11L, response.sourceResumeAnalysisId());
        assertEquals(22L, response.sourceJobAnalysisId());
        verify(careerAiProvider).generateCareerRoadmap(context);
        assertEquals(List.of("SHORT_TERM", "SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"),
                response.items().stream().map(item -> item.category().name()).toList());
        assertEquals(List.of("Docker", "Docker", "Docker", "Kubernetes"),
                response.items().stream().map(item -> item.skills().get(0)).toList());
        assertEquals(CareerPlanItem.ItemType.LEARNING, response.items().get(0).itemType());
        assertEquals(CareerPlanItem.ItemType.RESUME, response.items().get(1).itemType());
        assertEquals(CareerPlanItem.ItemType.PROJECT, response.items().get(2).itemType());
        assertEquals(CareerPlanItem.ItemType.INTERVIEW, response.items().get(3).itemType());
        assertEquals(List.of("HIGH", "HIGH", "MEDIUM", "LOW"),
                response.items().stream().map(item -> item.priority()).toList());
    }

    @Test
    void missingResumeAndJobDoNotBreakGeneration() {
        when(resumeAnalysisRepository.findTopByUserIdOrderByCreatedAtDesc(7L)).thenReturn(Optional.empty());
        when(jobIntelligenceRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());

        var response = service.generateCareerPlan();

        assertEquals(null, response.sourceResumeAnalysisId());
        assertEquals(null, response.sourceJobAnalysisId());
        assertFalse(response.items().isEmpty());
    }

    @Test
    void currentAndByIdReadsAreOwnershipConstrained() {
        CareerPlan plan = planWithItem(50L, 501L);
        when(careerPlanRepository.findFirstByUserIdAndStatusOrderByUpdatedAtDesc(7L, CareerPlan.Status.ACTIVE))
                .thenReturn(Optional.of(plan));
        when(careerPlanRepository.findByIdAndUserId(50L, 7L)).thenReturn(Optional.of(plan));

        assertEquals(50L, service.getCurrentPlan().id());
        assertEquals(50L, service.getPlanById(50L).id());

        when(careerPlanRepository.findByIdAndUserId(99L, 7L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getPlanById(99L));
    }

    @Test
    void itemUpdateRequiresOwnedPlanAndItemBelongingToThatPlan() {
        CareerPlan plan = planWithItem(50L, 501L);
        CareerPlanItem item = plan.getItems().get(0);
        when(careerPlanRepository.findByIdAndUserId(50L, 7L)).thenReturn(Optional.of(plan));
        when(careerPlanItemRepository.findByIdAndCareerPlanId(501L, 50L)).thenReturn(Optional.of(item));
        when(careerPlanItemRepository.save(item)).thenReturn(item);

        var response = service.updatePlanItem(50L, 501L, true);

        assertEquals(true, response.items().get(0).completed());
        verify(careerPlanItemRepository).save(item);

        when(careerPlanRepository.findByIdAndUserId(99L, 7L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.updatePlanItem(99L, 501L, false));
        verify(careerPlanItemRepository, never()).findByIdAndCareerPlanId(501L, 99L);

        when(careerPlanItemRepository.findByIdAndCareerPlanId(999L, 50L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.updatePlanItem(50L, 999L, false));
    }

    private CareerPlan planWithItem(Long planId, Long itemId) {
        CareerPlan plan = new CareerPlan();
        plan.setId(planId);
        plan.setUser(authenticatedUser);
        CareerPlanItem item = new CareerPlanItem();
        item.setId(itemId);
        item.setCategory(CareerPlanItem.Category.SHORT_TERM);
        item.setItemType(CareerPlanItem.ItemType.LEARNING);
        item.setTitle("Learn Docker");
        item.setSkills(List.of("Docker"));
        item.setPriority("HIGH");
        item.setSortOrder(0);
        plan.addItem(item);
        return plan;
    }
}