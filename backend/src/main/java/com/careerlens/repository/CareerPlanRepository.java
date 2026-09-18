package com.careerlens.repository;

import com.careerlens.entity.CareerPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CareerPlanRepository extends JpaRepository<CareerPlan, Long> {

    Optional<CareerPlan> findByIdAndUserId(Long id, Long userId);

    Optional<CareerPlan> findFirstByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, CareerPlan.Status status);
}