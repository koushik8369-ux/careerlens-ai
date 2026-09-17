package com.careerlens.service;

import com.careerlens.dto.ResumeAnalysisResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ResumeAnalysisService {

    ResumeAnalysisResponse analyzeResume(String userEmail, MultipartFile file, String targetRole);

    List<ResumeAnalysisResponse> getUserAnalysisHistory(String userEmail);

    ResumeAnalysisResponse getAnalysisById(String userEmail, Long id);
}
