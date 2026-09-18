package com.careerlens.repository;

import com.careerlens.entity.CareerPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CareerPlanItemRepository extends JpaRepository<CareerPlanItem, Long> {

    Optional<CareerPlanItem> findByIdAndCareerPlanId(Long id, Long careerPlanId);
}