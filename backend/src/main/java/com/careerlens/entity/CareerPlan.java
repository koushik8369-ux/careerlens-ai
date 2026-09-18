package com.careerlens.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "career_plans")
public class CareerPlan {

    public enum Status {
        ACTIVE,
        COMPLETED,
        ARCHIVED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_resume_analysis_id")
    private ResumeAnalysis sourceResumeAnalysis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_job_analysis_id")
    private JobIntelligenceAnalysis sourceJobAnalysis;

    @Column(name = "career_goal", length = 1000)
    private String careerGoal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "careerPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    private List<CareerPlanItem> items = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (updatedAt == null) {
            updatedAt = createdAt == null ? LocalDateTime.now() : createdAt;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public ResumeAnalysis getSourceResumeAnalysis() { return sourceResumeAnalysis; }
    public void setSourceResumeAnalysis(ResumeAnalysis sourceResumeAnalysis) { this.sourceResumeAnalysis = sourceResumeAnalysis; }
    public JobIntelligenceAnalysis getSourceJobAnalysis() { return sourceJobAnalysis; }
    public void setSourceJobAnalysis(JobIntelligenceAnalysis sourceJobAnalysis) { this.sourceJobAnalysis = sourceJobAnalysis; }
    public String getCareerGoal() { return careerGoal; }
    public void setCareerGoal(String careerGoal) { this.careerGoal = careerGoal; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<CareerPlanItem> getItems() { return items; }
    public void setItems(List<CareerPlanItem> items) { this.items = items == null ? new ArrayList<>() : items; }
    public void addItem(CareerPlanItem item) { items.add(item); item.setCareerPlan(this); }
}