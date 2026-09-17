package com.careerlens.repository;

import com.careerlens.entity.ResumeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, Long> {
    List<ResumeAnalysis> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<ResumeAnalysis> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<ResumeAnalysis> findByIdAndUserId(Long id, Long userId);
}
