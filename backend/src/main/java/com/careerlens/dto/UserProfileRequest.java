package com.careerlens.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class UserProfileRequest {

    @Size(max = 30, message = "Phone must be at most 30 characters")
    private String phone;

    @Size(max = 120, message = "Education must be at most 120 characters")
    private String education;

    @Size(max = 160, message = "College must be at most 160 characters")
    private String college;

    @Min(value = 1900, message = "Graduation year must be valid")
    @Max(value = 2200, message = "Graduation year must be valid")
    private Integer graduationYear;

    @Size(max = 160, message = "Career goal must be at most 160 characters")
    private String careerGoal;

    @Size(max = 2000, message = "Bio must be at most 2000 characters")
    private String bio;

    @Size(max = 120, message = "Location must be at most 120 characters")
    private String location;

    @Size(max = 50, message = "A maximum of 50 skills is allowed")
    private List<@Size(max = 80, message = "Skill must be at most 80 characters") String> skills = new ArrayList<>();

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }
    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }
    public Integer getGraduationYear() { return graduationYear; }
    public void setGraduationYear(Integer graduationYear) { this.graduationYear = graduationYear; }
    public String getCareerGoal() { return careerGoal; }
    public void setCareerGoal(String careerGoal) { this.careerGoal = careerGoal; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }
}
