package com.careerlens.dto;

public class CareerRecommendationDTO {
    private String category; // LEARNING, PROJECT, PREPARATION
    private String title;
    private String description;

    public CareerRecommendationDTO() {
    }

    public CareerRecommendationDTO(String category, String title, String description) {
        this.category = category;
        this.title = title;
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
