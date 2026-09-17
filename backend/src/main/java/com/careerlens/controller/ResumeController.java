package com.careerlens.controller;

import com.careerlens.dto.ResumeAnalysisResponse;
import com.careerlens.service.ResumeAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeAnalysisService resumeAnalysisService;

    public ResumeController(ResumeAnalysisService resumeAnalysisService) {
        this.resumeAnalysisService = resumeAnalysisService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<ResumeAnalysisResponse> analyzeResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetRole", required = false) String targetRole) {
        ResumeAnalysisResponse response = resumeAnalysisService.analyzeResume(userDetails.getUsername(), file, targetRole);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<ResumeAnalysisResponse>> getAnalysisHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ResumeAnalysisResponse> history = resumeAnalysisService.getUserAnalysisHistory(userDetails.getUsername());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResumeAnalysisResponse> getAnalysisById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        ResumeAnalysisResponse response = resumeAnalysisService.getAnalysisById(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }
}
