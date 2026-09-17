package com.careerlens.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resume_analyses")
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "overall_score", nullable = false)
    private Integer overallScore;

    @Column(name = "target_role")
    private String targetRole;

    @Column(name = "match_score")
    private Integer matchScore;

    @Lob
    @Column(name = "raw_text", columnDefinition = "LONGTEXT")
    private String rawText;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "resume_analysis_skills", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "skill_order")
    @Column(name = "skill", nullable = false)
    private List<String> detectedSkills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "resume_analysis_education", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "edu_order")
    @Column(name = "education_item", nullable = false, length = 500)
    private List<String> detectedEducation = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "resume_analysis_experience", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "exp_order")
    @Column(name = "experience_item", nullable = false, length = 500)
    private List<String> detectedExperience = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "resume_analysis_projects", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "proj_order")
    @Column(name = "project_item", nullable = false, length = 500)
    private List<String> detectedProjects = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "resume_analysis_missing_sections", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "missing_order")
    @Column(name = "missing_section", nullable = false)
    private List<String> missingSections = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "resume_analysis_suggestions", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "suggestion_order")
    @Column(name = "suggestion", nullable = false, length = 1000)
    private List<String> improvementSuggestions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ResumeAnalysis() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public String getRawText() {
        return rawText;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }

    public List<String> getDetectedSkills() {
        return detectedSkills;
    }

    public void setDetectedSkills(List<String> detectedSkills) {
        this.detectedSkills = detectedSkills != null ? new ArrayList<>(detectedSkills) : new ArrayList<>();
    }

    public List<String> getDetectedEducation() {
        return detectedEducation;
    }

    public void setDetectedEducation(List<String> detectedEducation) {
        this.detectedEducation = detectedEducation != null ? new ArrayList<>(detectedEducation) : new ArrayList<>();
    }

    public List<String> getDetectedExperience() {
        return detectedExperience;
    }

    public void setDetectedExperience(List<String> detectedExperience) {
        this.detectedExperience = detectedExperience != null ? new ArrayList<>(detectedExperience) : new ArrayList<>();
    }

    public List<String> getDetectedProjects() {
        return detectedProjects;
    }

    public void setDetectedProjects(List<String> detectedProjects) {
        this.detectedProjects = detectedProjects != null ? new ArrayList<>(detectedProjects) : new ArrayList<>();
    }

    public List<String> getMissingSections() {
        return missingSections;
    }

    public void setMissingSections(List<String> missingSections) {
        this.missingSections = missingSections != null ? new ArrayList<>(missingSections) : new ArrayList<>();
    }

    public List<String> getImprovementSuggestions() {
        return improvementSuggestions;
    }

    public void setImprovementSuggestions(List<String> improvementSuggestions) {
        this.improvementSuggestions = improvementSuggestions != null ? new ArrayList<>(improvementSuggestions) : new ArrayList<>();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
