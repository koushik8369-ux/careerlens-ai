import api from './api';
import type {
  JobAnalysisRequest,
  JobAnalysisResponse,
  JobRecommendationsResponse,
} from '../types';

export const analyzeJob = async (request: JobAnalysisRequest): Promise<JobAnalysisResponse> => {
  const response = await api.post<JobAnalysisResponse>('/job-intelligence/analyze', request);
  return response.data;
};

export const getJobHistory = async (): Promise<JobAnalysisResponse[]> => {
  const response = await api.get<JobAnalysisResponse[]>('/job-intelligence/history');
  return response.data;
};

export const getJobAnalysisById = async (id: string): Promise<JobAnalysisResponse> => {
  const response = await api.get<JobAnalysisResponse>(`/job-intelligence/${id}`);
  return response.data;
};

export const getRecommendedJobs = async (
  resumeAnalysisId: string,
  limit = 8,
): Promise<JobRecommendationsResponse> => {
  const response = await api.get<JobRecommendationsResponse>('/jobs/recommended', {
    params: { resumeAnalysisId, limit },
  });
  return response.data;
};
