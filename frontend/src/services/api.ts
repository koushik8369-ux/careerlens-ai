import axios from 'axios';
import { HealthStatusResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const checkHealth = async (): Promise<HealthStatusResponse> => {
  const response = await api.get<HealthStatusResponse>('/health');
  return response.data;
};

export default api;
