package com.careerlens.service;

import com.careerlens.dto.CareerAssistantConversationResponse;
import com.careerlens.dto.CareerAssistantMessageResponse;

import java.util.List;

public interface CareerAssistantService {

    CareerAssistantConversationResponse createConversation();

    List<CareerAssistantConversationResponse> getUserConversations();

    List<CareerAssistantMessageResponse> getConversationMessages(Long conversationId);

    CareerAssistantMessageResponse sendMessage(Long conversationId, String question);
}