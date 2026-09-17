package com.careerlens.service;

import com.careerlens.dto.JobAnalysisRequest;
import com.careerlens.dto.JobAnalysisResponse;

import java.util.List;

public interface JobIntelligenceService {
    JobAnalysisResponse analyzeJobDescription(String userEmail, JobAnalysisRequest request);
    List<JobAnalysisResponse> getAnalysisHistory(String userEmail);
    JobAnalysisResponse getAnalysisById(String userEmail, Long id);
}
