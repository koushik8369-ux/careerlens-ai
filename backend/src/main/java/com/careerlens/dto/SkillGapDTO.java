package com.careerlens.dto;

public class SkillGapDTO {
    private String skill;
    private String priority; // HIGH, MEDIUM, LOW
    private String explanation;

    public SkillGapDTO() {
    }

    public SkillGapDTO(String skill, String priority, String explanation) {
        this.skill = skill;
        this.priority = priority;
        this.explanation = explanation;
    }

    public String getSkill() {
        return skill;
    }

    public void setSkill(String skill) {
        this.skill = skill;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}
