import api from './api';
import type {
  CareerAssistantConversation,
  CareerAssistantMessage,
  CareerAssistantMessageRequest,
  CareerPlan,
  CareerPlanItemUpdateRequest,
  ResumeImprovementResult,
} from '../types';

export const createCareerAssistantConversation = async (): Promise<CareerAssistantConversation> => {
  const response = await api.post<CareerAssistantConversation>('/career-assistant/conversations');
  return response.data;
};

export const getCareerAssistantConversations = async (): Promise<CareerAssistantConversation[]> => {
  const response = await api.get<CareerAssistantConversation[]>('/career-assistant/conversations');
  return response.data;
};

export const getCareerAssistantMessages = async (conversationId: number): Promise<CareerAssistantMessage[]> => {
  const response = await api.get<CareerAssistantMessage[]>(`/career-assistant/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendCareerAssistantMessage = async (
  conversationId: number,
  request: CareerAssistantMessageRequest,
): Promise<CareerAssistantMessage> => {
  const response = await api.post<CareerAssistantMessage>(
    `/career-assistant/conversations/${conversationId}/messages`,
    request,
  );
  return response.data;
};

export const requestResumeImprovement = async (): Promise<ResumeImprovementResult> => {
  const response = await api.post<ResumeImprovementResult>('/career-assistant/resume-improvement');
  return response.data;
};

export const generateCareerPlan = async (): Promise<CareerPlan> => {
  const response = await api.post<CareerPlan>('/career-plans');
  return response.data;
};

export const getCurrentCareerPlan = async (): Promise<CareerPlan> => {
  const response = await api.get<CareerPlan>('/career-plans/current');
  return response.data;
};

export const getCareerPlan = async (planId: number): Promise<CareerPlan> => {
  const response = await api.get<CareerPlan>(`/career-plans/${planId}`);
  return response.data;
};

export const updateCareerPlanItem = async (
  planId: number,
  itemId: number,
  request: CareerPlanItemUpdateRequest,
): Promise<CareerPlan> => {
  const response = await api.patch<CareerPlan>(`/career-plans/${planId}/items/${itemId}`, request);
  return response.data;
};