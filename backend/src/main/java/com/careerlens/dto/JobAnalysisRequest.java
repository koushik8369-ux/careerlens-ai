package com.careerlens.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class JobAnalysisRequest {

    private String jobTitle;

    private String companyName;

    @NotBlank(message = "Job description cannot be blank")
    @Size(min = 30, max = 20000, message = "Job description must be between 30 and 20,000 characters")
    private String jobDescription;

    public JobAnalysisRequest() {
    }

    public JobAnalysisRequest(String jobTitle, String companyName, String jobDescription) {
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.jobDescription = jobDescription;
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

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }
}
