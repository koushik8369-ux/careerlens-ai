import api from './api';
import type { JobAnalysisRequest, JobAnalysisResponse } from '../types';

export const analyzeJob = async (request: JobAnalysisRequest): Promise<JobAnalysisResponse> => {
  const response = await api.post<JobAnalysisResponse>('/job-intelligence/analyze', request);
  return response.data;
};

export const getJobHistory = async (): Promise<JobAnalysisResponse[]> => {
  const response = await api.get<JobAnalysisResponse[]>('/job-intelligence/history');
  return response.data;
};

export const getJobAnalysisById = async (id: number): Promise<JobAnalysisResponse> => {
  const response = await api.get<JobAnalysisResponse>(`/job-intelligence/${id}`);
  return response.data;
};
