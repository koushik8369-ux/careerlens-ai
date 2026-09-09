package com.careerlens.dto;

import com.careerlens.entity.UserProfile;

import java.time.LocalDateTime;
import java.util.List;

public class UserProfileResponse {

    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String education;
    private String college;
    private Integer graduationYear;
    private String careerGoal;
    private String bio;
    private String location;
    private List<String> skills;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserProfileResponse fromEntity(UserProfile profile) {
        UserProfileResponse response = new UserProfileResponse();
        response.userId = profile.getUser().getId();
        response.fullName = profile.getUser().getFullName();
        response.email = profile.getUser().getEmail();
        response.phone = profile.getPhone();
        response.education = profile.getEducation();
        response.college = profile.getCollege();
        response.graduationYear = profile.getGraduationYear();
        response.careerGoal = profile.getCareerGoal();
        response.bio = profile.getBio();
        response.location = profile.getLocation();
        response.skills = List.copyOf(profile.getSkills());
        response.createdAt = profile.getCreatedAt();
        response.updatedAt = profile.getUpdatedAt();
        return response;
    }

    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getEducation() { return education; }
    public String getCollege() { return college; }
    public Integer getGraduationYear() { return graduationYear; }
    public String getCareerGoal() { return careerGoal; }
    public String getBio() { return bio; }
    public String getLocation() { return location; }
    public List<String> getSkills() { return skills; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
