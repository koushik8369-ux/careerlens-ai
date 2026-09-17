package com.careerlens.controller;

import com.careerlens.dto.JobAnalysisRequest;
import com.careerlens.dto.JobAnalysisResponse;
import com.careerlens.service.JobIntelligenceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-intelligence")
public class JobIntelligenceController {

    private final JobIntelligenceService jobIntelligenceService;

    public JobIntelligenceController(JobIntelligenceService jobIntelligenceService) {
        this.jobIntelligenceService = jobIntelligenceService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<JobAnalysisResponse> analyzeJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody JobAnalysisRequest request) {
        JobAnalysisResponse response = jobIntelligenceService.analyzeJobDescription(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<JobAnalysisResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<JobAnalysisResponse> history = jobIntelligenceService.getAnalysisHistory(userDetails.getUsername());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobAnalysisResponse> getAnalysisById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        JobAnalysisResponse response = jobIntelligenceService.getAnalysisById(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }
}
