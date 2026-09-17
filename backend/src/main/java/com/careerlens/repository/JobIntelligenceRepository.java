package com.careerlens.repository;

import com.careerlens.entity.JobIntelligenceAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobIntelligenceRepository extends JpaRepository<JobIntelligenceAnalysis, Long> {
    List<JobIntelligenceAnalysis> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<JobIntelligenceAnalysis> findByIdAndUserId(Long id, Long userId);
}
