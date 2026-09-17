package com.careerlens.ai.context;

import java.util.List;

public final class UserCareerContext {

    private final String careerGoal;
    private final List<String> skills;
    private final String education;
    private final String college;
    private final Integer graduationYear;
    private final String bio;
    private final List<String> resumeDetectedSkills;
    private final List<String> resumeEducation;
    private final List<String> resumeExperience;
    private final List<String> resumeProjects;
    private final List<String> resumeMissingSections;
    private final List<String> resumeSuggestions;
    private final String latestJobTitle;
    private final String latestJobCompany;
    private final Integer latestJobOverallScore;
    private final List<String> latestJobRequiredSkills;
    private final List<String> latestJobPreferredSkills;
    private final List<String> latestJobMatchedSkills;
    private final List<String> latestJobMissingSkills;
    private final List<CareerSkillGap> latestJobSkillGaps;

    public UserCareerContext(
            String careerGoal,
            List<String> skills,
            String education,
            String college,
            Integer graduationYear,
            String bio,
            List<String> resumeDetectedSkills,
            List<String> resumeEducation,
            List<String> resumeExperience,
            List<String> resumeProjects,
            List<String> resumeMissingSections,
            List<String> resumeSuggestions,
            String latestJobTitle,
            String latestJobCompany,
            Integer latestJobOverallScore,
            List<String> latestJobRequiredSkills,
            List<String> latestJobPreferredSkills,
            List<String> latestJobMatchedSkills,
            List<String> latestJobMissingSkills,
            List<CareerSkillGap> latestJobSkillGaps) {
        this.careerGoal = careerGoal;
        this.skills = List.copyOf(skills);
        this.education = education;
        this.college = college;
        this.graduationYear = graduationYear;
        this.bio = bio;
        this.resumeDetectedSkills = List.copyOf(resumeDetectedSkills);
        this.resumeEducation = List.copyOf(resumeEducation);
        this.resumeExperience = List.copyOf(resumeExperience);
        this.resumeProjects = List.copyOf(resumeProjects);
        this.resumeMissingSections = List.copyOf(resumeMissingSections);
        this.resumeSuggestions = List.copyOf(resumeSuggestions);
        this.latestJobTitle = latestJobTitle;
        this.latestJobCompany = latestJobCompany;
        this.latestJobOverallScore = latestJobOverallScore;
        this.latestJobRequiredSkills = List.copyOf(latestJobRequiredSkills);
        this.latestJobPreferredSkills = List.copyOf(latestJobPreferredSkills);
        this.latestJobMatchedSkills = List.copyOf(latestJobMatchedSkills);
        this.latestJobMissingSkills = List.copyOf(latestJobMissingSkills);
        this.latestJobSkillGaps = List.copyOf(latestJobSkillGaps);
    }

    public String getCareerGoal() { return careerGoal; }
    public List<String> getSkills() { return skills; }
    public String getEducation() { return education; }
    public String getCollege() { return college; }
    public Integer getGraduationYear() { return graduationYear; }
    public String getBio() { return bio; }
    public List<String> getResumeDetectedSkills() { return resumeDetectedSkills; }
    public List<String> getResumeEducation() { return resumeEducation; }
    public List<String> getResumeExperience() { return resumeExperience; }
    public List<String> getResumeProjects() { return resumeProjects; }
    public List<String> getResumeMissingSections() { return resumeMissingSections; }
    public List<String> getResumeSuggestions() { return resumeSuggestions; }
    public String getLatestJobTitle() { return latestJobTitle; }
    public String getLatestJobCompany() { return latestJobCompany; }
    public Integer getLatestJobOverallScore() { return latestJobOverallScore; }
    public List<String> getLatestJobRequiredSkills() { return latestJobRequiredSkills; }
    public List<String> getLatestJobPreferredSkills() { return latestJobPreferredSkills; }
    public List<String> getLatestJobMatchedSkills() { return latestJobMatchedSkills; }
    public List<String> getLatestJobMissingSkills() { return latestJobMissingSkills; }
    public List<CareerSkillGap> getLatestJobSkillGaps() { return latestJobSkillGaps; }
}
