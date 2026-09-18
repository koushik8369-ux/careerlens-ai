package com.careerlens.controller;

import com.careerlens.dto.CareerPlanItemUpdateRequest;
import com.careerlens.dto.CareerPlanResponse;
import com.careerlens.service.CareerPlanService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/career-plans")
public class CareerPlanController {

    private final CareerPlanService careerPlanService;

    public CareerPlanController(CareerPlanService careerPlanService) {
        this.careerPlanService = careerPlanService;
    }

    @PostMapping
    public ResponseEntity<CareerPlanResponse> generateCareerPlan() {
        return ResponseEntity.ok(careerPlanService.generateCareerPlan());
    }

    @GetMapping("/current")
    public ResponseEntity<CareerPlanResponse> getCurrentPlan() {
        return ResponseEntity.ok(careerPlanService.getCurrentPlan());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CareerPlanResponse> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(careerPlanService.getPlanById(id));
    }

    @PatchMapping("/{id}/items/{itemId}")
    public ResponseEntity<CareerPlanResponse> updatePlanItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody CareerPlanItemUpdateRequest request) {
        return ResponseEntity.ok(careerPlanService.updatePlanItem(id, itemId, request.completed()));
    }
}