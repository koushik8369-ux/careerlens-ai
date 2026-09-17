import api from './api';
import type { ResumeAnalysisResponse } from '../types';

export const analyzeResume = async (
  file: File,
  targetRole?: string,
): Promise<ResumeAnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (targetRole && targetRole.trim()) {
    formData.append('targetRole', targetRole.trim());
  }

  const response = await api.post<ResumeAnalysisResponse>('/resume/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getResumeHistory = async (): Promise<ResumeAnalysisResponse[]> => {
  const response = await api.get<ResumeAnalysisResponse[]>('/resume/history');
  return response.data;
};

export const getResumeAnalysisById = async (id: number): Promise<ResumeAnalysisResponse> => {
  const response = await api.get<ResumeAnalysisResponse>(`/resume/${id}`);
  return response.data;
};
