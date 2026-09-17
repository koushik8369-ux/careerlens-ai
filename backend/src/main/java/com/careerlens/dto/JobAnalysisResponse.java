package com.careerlens.dto;

import java.time.LocalDateTime;
import java.util.List;

public class JobAnalysisResponse {

    private Long id;
    private String jobTitle;
    private String companyName;
    private String rawJobDescription;
    private Integer overallMatchScore;
    private Integer requiredSkillMatchPercent;
    private Integer preferredSkillMatchPercent;
    private List<String> requiredSkills;
    private List<String> preferredSkills;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private List<SkillGapDTO> skillGaps;
    private List<CareerRecommendationDTO> recommendations;
    private List<InterviewQuestionDTO> interviewQuestions;
    private LocalDateTime createdAt;

    public JobAnalysisResponse() {
    }

    public JobAnalysisResponse(Long id, String jobTitle, String companyName, String rawJobDescription,
                               Integer overallMatchScore, Integer requiredSkillMatchPercent, Integer preferredSkillMatchPercent,
                               List<String> requiredSkills, List<String> preferredSkills, List<String> matchedSkills,
                               List<String> missingSkills, List<SkillGapDTO> skillGaps,
                               List<CareerRecommendationDTO> recommendations, List<InterviewQuestionDTO> interviewQuestions,
                               LocalDateTime createdAt) {
        this.id = id;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.rawJobDescription = rawJobDescription;
        this.overallMatchScore = overallMatchScore;
        this.requiredSkillMatchPercent = requiredSkillMatchPercent;
        this.preferredSkillMatchPercent = preferredSkillMatchPercent;
        this.requiredSkills = requiredSkills;
        this.preferredSkills = preferredSkills;
        this.matchedSkills = matchedSkills;
        this.missingSkills = missingSkills;
        this.skillGaps = skillGaps;
        this.recommendations = recommendations;
        this.interviewQuestions = interviewQuestions;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
        this.requiredSkills = requiredSkills;
    }

    public List<String> getPreferredSkills() {
        return preferredSkills;
    }

    public void setPreferredSkills(List<String> preferredSkills) {
        this.preferredSkills = preferredSkills;
    }

    public List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(List<String> matchedSkills) {
        this.matchedSkills = matchedSkills;
    }

    public List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(List<String> missingSkills) {
        this.missingSkills = missingSkills;
    }

    public List<SkillGapDTO> getSkillGaps() {
        return skillGaps;
    }

    public void setSkillGaps(List<SkillGapDTO> skillGaps) {
        this.skillGaps = skillGaps;
    }

    public List<CareerRecommendationDTO> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<CareerRecommendationDTO> recommendations) {
        this.recommendations = recommendations;
    }

    public List<InterviewQuestionDTO> getInterviewQuestions() {
        return interviewQuestions;
    }

    public void setInterviewQuestions(List<InterviewQuestionDTO> interviewQuestions) {
        this.interviewQuestions = interviewQuestions;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
