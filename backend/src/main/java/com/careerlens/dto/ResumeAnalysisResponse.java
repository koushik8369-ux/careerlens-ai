package com.careerlens.dto;

import com.careerlens.entity.ResumeAnalysis;

import java.time.LocalDateTime;
import java.util.List;

public class ResumeAnalysisResponse {

    private Long id;
    private String fileName;
    private String fileType;
    private Integer overallScore;
    private String targetRole;
    private Integer matchScore;
    private List<String> detectedSkills;
    private List<String> detectedEducation;
    private List<String> detectedExperience;
    private List<String> detectedProjects;
    private List<String> missingSections;
    private List<String> improvementSuggestions;
    private LocalDateTime createdAt;

    public ResumeAnalysisResponse() {
    }

    public static ResumeAnalysisResponse fromEntity(ResumeAnalysis analysis) {
        ResumeAnalysisResponse dto = new ResumeAnalysisResponse();
        dto.setId(analysis.getId());
        dto.setFileName(analysis.getFileName());
        dto.setFileType(analysis.getFileType());
        dto.setOverallScore(analysis.getOverallScore());
        dto.setTargetRole(analysis.getTargetRole());
        dto.setMatchScore(analysis.getMatchScore());
        dto.setDetectedSkills(analysis.getDetectedSkills());
        dto.setDetectedEducation(analysis.getDetectedEducation());
        dto.setDetectedExperience(analysis.getDetectedExperience());
        dto.setDetectedProjects(analysis.getDetectedProjects());
        dto.setMissingSections(analysis.getMissingSections());
        dto.setImprovementSuggestions(analysis.getImprovementSuggestions());
        dto.setCreatedAt(analysis.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public Integer getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Integer matchScore) {
        this.matchScore = matchScore;
    }

    public List<String> getDetectedSkills() {
        return detectedSkills;
    }

    public void setDetectedSkills(List<String> detectedSkills) {
        this.detectedSkills = detectedSkills;
    }

    public List<String> getDetectedEducation() {
        return detectedEducation;
    }

    public void setDetectedEducation(List<String> detectedEducation) {
        this.detectedEducation = detectedEducation;
    }

    public List<String> getDetectedExperience() {
        return detectedExperience;
    }

    public void setDetectedExperience(List<String> detectedExperience) {
        this.detectedExperience = detectedExperience;
    }

    public List<String> getDetectedProjects() {
        return detectedProjects;
    }

    public void setDetectedProjects(List<String> detectedProjects) {
        this.detectedProjects = detectedProjects;
    }

    public List<String> getMissingSections() {
        return missingSections;
    }

    public void setMissingSections(List<String> missingSections) {
        this.missingSections = missingSections;
    }

    public List<String> getImprovementSuggestions() {
        return improvementSuggestions;
    }

    public void setImprovementSuggestions(List<String> improvementSuggestions) {
        this.improvementSuggestions = improvementSuggestions;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
