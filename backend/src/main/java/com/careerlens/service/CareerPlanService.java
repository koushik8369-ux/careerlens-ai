package com.careerlens.service;

import com.careerlens.dto.CareerPlanResponse;

public interface CareerPlanService {

    CareerPlanResponse generateCareerPlan();

    CareerPlanResponse getCurrentPlan();

    CareerPlanResponse getPlanById(Long id);

    CareerPlanResponse updatePlanItem(Long id, Long itemId, boolean completed);
}