package com.careerlens.repository;

import com.careerlens.entity.CareerAssistantConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CareerAssistantConversationRepository extends JpaRepository<CareerAssistantConversation, Long> {

    Optional<CareerAssistantConversation> findByIdAndUserId(Long id, Long userId);

    List<CareerAssistantConversation> findByUserIdOrderByUpdatedAtDesc(Long userId);
}