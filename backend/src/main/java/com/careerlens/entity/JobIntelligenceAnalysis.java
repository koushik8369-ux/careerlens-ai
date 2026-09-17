package com.careerlens.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_intelligence_analyses")
public class JobIntelligenceAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "company_name")
    private String companyName;

    @Lob
    @Column(name = "raw_job_description", columnDefinition = "LONGTEXT")
    private String rawJobDescription;

    @Column(name = "overall_match_score", nullable = false)
    private Integer overallMatchScore;

    @Column(name = "required_skill_match_percent")
    private Integer requiredSkillMatchPercent;

    @Column(name = "preferred_skill_match_percent")
    private Integer preferredSkillMatchPercent;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "job_intel_required_skills", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "skill_order")
    @Column(name = "skill", nullable = false)
    private List<String> requiredSkills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "job_intel_preferred_skills", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "skill_order")
    @Column(name = "skill", nullable = false)
    private List<String> preferredSkills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "job_intel_matched_skills", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "skill_order")
    @Column(name = "skill", nullable = false)
    private List<String> matchedSkills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "job_intel_missing_skills", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "skill_order")
    @Column(name = "skill", nullable = false)
    private List<String> missingSkills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "job_intel_skill_gaps", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "gap_order")
    @Column(name = "skill_gap_json", nullable = false, length = 1000)
    private List<String> skillGapsJson = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "job_intel_recommendations", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "rec_order")
    @Column(name = "recommendation_json", nullable = false, length = 1000)
    private List<String> recommendationsJson = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "job_intel_questions", joinColumns = @JoinColumn(name = "analysis_id"))
    @OrderColumn(name = "q_order")
    @Column(name = "question_json", nullable = false, length = 1000)
    private List<String> questionsJson = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public JobIntelligenceAnalysis() {
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

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getRawJobDescription() {
        return rawJobDescription;
    }

    public void setRawJobDescription(String rawJobDescription) {
        this.rawJobDescription = rawJobDescription;
    }

    public Integer getOverallMatchScore() {
        return overallMatchScore;
    }

    public void setOverallMatchScore(Integer overallMatchScore) {
        this.overallMatchScore = overallMatchScore;
    }

    public Integer getRequiredSkillMatchPercent() {
        return requiredSkillMatchPercent;
    }

    public void setRequiredSkillMatchPercent(Integer requiredSkillMatchPercent) {
        this.requiredSkillMatchPercent = requiredSkillMatchPercent;
    }

    public Integer getPreferredSkillMatchPercent() {
        return preferredSkillMatchPercent;
    }

    public void setPreferredSkillMatchPercent(Integer preferredSkillMatchPercent) {
        this.preferredSkillMatchPercent = preferredSkillMatchPercent;
    }

    public List<String> getRequiredSkills() {
        return requiredSkills;
    }

    public void setRequiredSkills(List<String> requiredSkills) {
        this.requiredSkills = requiredSkills != null ? new ArrayList<>(requiredSkills) : new ArrayList<>();
    }

    public List<String> getPreferredSkills() {
        return preferredSkills;
    }

    public void setPreferredSkills(List<String> preferredSkills) {
        this.preferredSkills = preferredSkills != null ? new ArrayList<>(preferredSkills) : new ArrayList<>();
    }

    public List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(List<String> matchedSkills) {
        this.matchedSkills = matchedSkills != null ? new ArrayList<>(matchedSkills) : new ArrayList<>();
    }

    public List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(List<String> missingSkills) {
        this.missingSkills = missingSkills != null ? new ArrayList<>(missingSkills) : new ArrayList<>();
    }

    public List<String> getSkillGapsJson() {
        return skillGapsJson;
    }

    public void setSkillGapsJson(List<String> skillGapsJson) {
        this.skillGapsJson = skillGapsJson != null ? new ArrayList<>(skillGapsJson) : new ArrayList<>();
    }

    public List<String> getRecommendationsJson() {
        return recommendationsJson;
    }

    public void setRecommendationsJson(List<String> recommendationsJson) {
        this.recommendationsJson = recommendationsJson != null ? new ArrayList<>(recommendationsJson) : new ArrayList<>();
    }

    public List<String> getQuestionsJson() {
        return questionsJson;
    }

    public void setQuestionsJson(List<String> questionsJson) {
        this.questionsJson = questionsJson != null ? new ArrayList<>(questionsJson) : new ArrayList<>();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
