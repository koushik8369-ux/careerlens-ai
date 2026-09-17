package com.careerlens.dto;

public class InterviewQuestionDTO {
    private String question;
    private String category; // TECHNICAL, BEHAVIORAL, PROJECT
    private String rationale;

    public InterviewQuestionDTO() {
    }

    public InterviewQuestionDTO(String question, String category, String rationale) {
        this.question = question;
        this.category = category;
        this.rationale = rationale;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getRationale() {
        return rationale;
    }

    public void setRationale(String rationale) {
        this.rationale = rationale;
    }
}
