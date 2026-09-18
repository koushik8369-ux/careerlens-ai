package com.careerlens.repository;

import com.careerlens.entity.CareerAssistantMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CareerAssistantMessageRepository extends JpaRepository<CareerAssistantMessage, Long> {

    List<CareerAssistantMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
}