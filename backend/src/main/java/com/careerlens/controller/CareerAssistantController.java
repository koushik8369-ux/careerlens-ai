package com.careerlens.controller;

import com.careerlens.dto.CareerAssistantConversationResponse;
import com.careerlens.dto.CareerAssistantMessageRequest;
import com.careerlens.dto.CareerAssistantMessageResponse;
import com.careerlens.ai.provider.contracts.CareerRoadmapResult;
import com.careerlens.ai.provider.contracts.ResumeImprovementResult;
import com.careerlens.service.CareerAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/career-assistant")
public class CareerAssistantController {

    private final CareerAssistantService careerAssistantService;

    public CareerAssistantController(CareerAssistantService careerAssistantService) {
        this.careerAssistantService = careerAssistantService;
    }

    @PostMapping("/conversations")
    public ResponseEntity<CareerAssistantConversationResponse> createConversation() {
        return ResponseEntity.status(HttpStatus.CREATED).body(careerAssistantService.createConversation());
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<CareerAssistantConversationResponse>> getConversations() {
        return ResponseEntity.ok(careerAssistantService.getUserConversations());
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<CareerAssistantMessageResponse>> getMessages(@PathVariable Long conversationId) {
        return ResponseEntity.ok(careerAssistantService.getConversationMessages(conversationId));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<CareerAssistantMessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody CareerAssistantMessageRequest request) {
        return ResponseEntity.ok(careerAssistantService.sendMessage(conversationId, request.question()));
    }

    @PostMapping("/resume-improvement")
    public ResponseEntity<ResumeImprovementResult> improveResume() {
        return ResponseEntity.ok(careerAssistantService.improveResume());
    }

    @PostMapping("/roadmap")
    public ResponseEntity<CareerRoadmapResult> generateRoadmap() {
        return ResponseEntity.ok(careerAssistantService.generateRoadmap());
    }
}