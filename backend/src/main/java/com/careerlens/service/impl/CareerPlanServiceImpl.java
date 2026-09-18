package com.careerlens.service.impl;

import com.careerlens.ai.provider.CareerAiProvider;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.CareerRoadmapStage;
import com.careerlens.ai.context.UserCareerContext;
import com.careerlens.dto.CareerPlanItemResponse;
import com.careerlens.dto.CareerPlanResponse;
import com.careerlens.entity.CareerAssistantMessage;
import com.careerlens.entity.CareerPlan;
import com.careerlens.entity.CareerPlanItem;
import com.careerlens.entity.JobIntelligenceAnalysis;
import com.careerlens.entity.ResumeAnalysis;
import com.careerlens.entity.User;
import com.careerlens.exception.ResourceNotFoundException;
import com.careerlens.repository.CareerPlanItemRepository;
import com.careerlens.repository.CareerPlanRepository;
import com.careerlens.repository.JobIntelligenceRepository;
import com.careerlens.repository.ResumeAnalysisRepository;
import com.careerlens.service.CareerContextService;
import com.careerlens.service.CareerPlanService;
import com.careerlens.service.CurrentUserService;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class CareerPlanServiceImpl implements CareerPlanService {

    private final CurrentUserService currentUserService;
    private final CareerContextService careerContextService;
    private final CareerAiProvider careerAiProvider;
    private final CareerPlanRepository careerPlanRepository;
    private final CareerPlanItemRepository careerPlanItemRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final JobIntelligenceRepository jobIntelligenceRepository;

    public CareerPlanServiceImpl(
            CurrentUserService currentUserService,
            CareerContextService careerContextService,
            CareerAiProvider careerAiProvider,
            CareerPlanRepository careerPlanRepository,
            CareerPlanItemRepository careerPlanItemRepository,
            ResumeAnalysisRepository resumeAnalysisRepository,
            JobIntelligenceRepository jobIntelligenceRepository) {
        this.currentUserService = currentUserService;
        this.careerContextService = careerContextService;
        this.careerAiProvider = careerAiProvider;
        this.careerPlanRepository = careerPlanRepository;
        this.careerPlanItemRepository = careerPlanItemRepository;
        this.resumeAnalysisRepository = resumeAnalysisRepository;
        this.jobIntelligenceRepository = jobIntelligenceRepository;
    }

    @Override
    @Transactional
    public CareerPlanResponse generateCareerPlan() {
        User user = getAuthenticatedUser();
        UserCareerContext context = careerContextService.buildForCurrentUser();
        CareerRoadmapResult roadmap = careerAiProvider.generateCareerRoadmap(context);

        careerPlanRepository.findFirstByUserIdAndStatusOrderByUpdatedAtDesc(user.getId(), CareerPlan.Status.ACTIVE)
                .ifPresent(previous -> {
                    previous.setStatus(CareerPlan.Status.ARCHIVED);
                    careerPlanRepository.save(previous);
                });

        ResumeAnalysis resume = resumeAnalysisRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElse(null);
        JobIntelligenceAnalysis job = jobIntelligenceRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().findFirst().orElse(null);

        CareerPlan plan = new CareerPlan();
        plan.setUser(user);
        plan.setSourceResumeAnalysis(resume);
        plan.setSourceJobAnalysis(job);
        plan.setCareerGoal(context.getCareerGoal());
        plan.setStatus(CareerPlan.Status.ACTIVE);
        addProviderItems(plan, roadmap);
        return toResponse(careerPlanRepository.save(plan));
    }

    @Override
    @Transactional(readOnly = true)
    public CareerPlanResponse getCurrentPlan() {
        User user = getAuthenticatedUser();
        CareerPlan plan = careerPlanRepository
                .findFirstByUserIdAndStatusOrderByUpdatedAtDesc(user.getId(), CareerPlan.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Current career plan was not found"));
        return toResponse(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public CareerPlanResponse getPlanById(Long id) {
        CareerPlan plan = getOwnedPlan(id);
        return toResponse(plan);
    }

    @Override
    @Transactional
    public CareerPlanResponse updatePlanItem(Long id, Long itemId, boolean completed) {
        CareerPlan plan = getOwnedPlan(id);
        CareerPlanItem item = careerPlanItemRepository.findByIdAndCareerPlanId(itemId, plan.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Career plan item was not found with id: " + itemId));
        item.setCompleted(completed);
        careerPlanItemRepository.save(item);
        plan.setUpdatedAt(java.time.LocalDateTime.now());
        return toResponse(plan);
    }

    private void addProviderItems(CareerPlan plan, CareerRoadmapResult roadmap) {
        int sortOrder = 0;
        for (CareerRoadmapStage stage : roadmap.stages()) {
            CareerPlanItem.Category category = parseCategory(stage.name());
            String priority = priorityFor(category);
            for (String action : stage.actions()) {
                CareerPlanItem item = new CareerPlanItem();
                item.setCategory(category);
                item.setItemType(inferItemType(action));
                item.setTitle(action);
                item.setDescription(stage.objective());
                item.setSkills(stage.skills());
                item.setPriority(priority);
                item.setCompleted(false);
                item.setSortOrder(sortOrder++);
                plan.addItem(item);
            }
        }
    }

    private CareerPlanItem.Category parseCategory(String name) {
        try {
            return CareerPlanItem.Category.valueOf(name.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ignored) {
            return CareerPlanItem.Category.LONG_TERM;
        }
    }

    private CareerPlanItem.ItemType inferItemType(String action) {
        String normalized = action.toLowerCase(Locale.ROOT);
        if (normalized.contains("resume")) return CareerPlanItem.ItemType.RESUME;
        if (normalized.contains("interview")) return CareerPlanItem.ItemType.INTERVIEW;
        if (normalized.contains("project")) return CareerPlanItem.ItemType.PROJECT;
        return CareerPlanItem.ItemType.LEARNING;
    }

    private String priorityFor(CareerPlanItem.Category category) {
        return switch (category) {
            case SHORT_TERM -> "HIGH";
            case MEDIUM_TERM -> "MEDIUM";
            case LONG_TERM -> "LOW";
        };
    }

    private User getAuthenticatedUser() {
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
        return currentUserService.getRequiredUser(email);
    }

    private CareerPlan getOwnedPlan(Long id) {
        if (id == null) {
            throw new ResourceNotFoundException("Career plan was not found");
        }
        User user = getAuthenticatedUser();
        return careerPlanRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Career plan was not found with id: " + id));
    }

    private CareerPlanResponse toResponse(CareerPlan plan) {
        List<CareerPlanItemResponse> items = plan.getItems() == null ? List.of() : plan.getItems().stream()
                .map(item -> new CareerPlanItemResponse(
                        item.getId(), item.getCategory(), item.getItemType(), item.getTitle(), item.getDescription(),
                        List.copyOf(item.getSkills()), item.getPriority(), item.isCompleted(), item.getSortOrder()))
                .toList();
        return new CareerPlanResponse(
                plan.getId(),
                plan.getSourceResumeAnalysis() == null ? null : plan.getSourceResumeAnalysis().getId(),
                plan.getSourceJobAnalysis() == null ? null : plan.getSourceJobAnalysis().getId(),
                plan.getCareerGoal(), plan.getStatus(), plan.getCreatedAt(), plan.getUpdatedAt(), items);
    }
}