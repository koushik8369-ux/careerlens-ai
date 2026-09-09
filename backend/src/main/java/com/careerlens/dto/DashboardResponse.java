package com.careerlens.dto;

public class DashboardResponse {

    private final Long userId;
    private final String fullName;
    private final String email;
    private final String careerGoal;
    private final String education;
    private final int profileCompletionPercentage;
    private final int skillCount;
    private final String profileStatus;

    public DashboardResponse(
            Long userId,
            String fullName,
            String email,
            String careerGoal,
            String education,
            int profileCompletionPercentage,
            int skillCount,
            String profileStatus) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.careerGoal = careerGoal;
        this.education = education;
        this.profileCompletionPercentage = profileCompletionPercentage;
        this.skillCount = skillCount;
        this.profileStatus = profileStatus;
    }

    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getCareerGoal() { return careerGoal; }
    public String getEducation() { return education; }
    public int getProfileCompletionPercentage() { return profileCompletionPercentage; }
    public int getSkillCount() { return skillCount; }
    public String getProfileStatus() { return profileStatus; }
}
