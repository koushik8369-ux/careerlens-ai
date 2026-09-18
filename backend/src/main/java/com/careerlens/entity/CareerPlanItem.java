package com.careerlens.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "career_plan_items")
public class CareerPlanItem {

    public enum Category {
        SHORT_TERM,
        MEDIUM_TERM,
        LONG_TERM
    }

    public enum ItemType {
        LEARNING,
        PROJECT,
        INTERVIEW,
        RESUME
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "career_plan_id", nullable = false)
    private CareerPlan careerPlan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private ItemType itemType;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 2000)
    private String description;

    @ElementCollection
    @CollectionTable(name = "career_plan_item_skills", joinColumns = @JoinColumn(name = "item_id"))
    @OrderColumn(name = "skill_order")
    @Column(name = "skill", nullable = false, length = 255)
    private List<String> skills = new ArrayList<>();

    @Column(nullable = false, length = 20)
    private String priority;

    @Column(nullable = false)
    private boolean completed;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CareerPlan getCareerPlan() { return careerPlan; }
    public void setCareerPlan(CareerPlan careerPlan) { this.careerPlan = careerPlan; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public ItemType getItemType() { return itemType; }
    public void setItemType(ItemType itemType) { this.itemType = itemType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills == null ? new ArrayList<>() : new ArrayList<>(skills); }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}