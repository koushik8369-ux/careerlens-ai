package com.careerlens.dto;

import com.careerlens.entity.CareerPlanItem;

import java.util.List;

public record CareerPlanItemResponse(
        Long id,
        CareerPlanItem.Category category,
        CareerPlanItem.ItemType itemType,
        String title,
        String description,
        List<String> skills,
        String priority,
        boolean completed,
        Integer sortOrder) {
}