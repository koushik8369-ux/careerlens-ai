import axios from 'axios';
import { HealthStatusResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const session = localStorage.getItem('careerlens_session');
  if (session) {
    try {
      const { token } = JSON.parse(session) as { token?: string };
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem('careerlens_session');
    }
  }
  return config;
});

export const checkHealth = async (): Promise<HealthStatusResponse> => {
  const response = await api.get<HealthStatusResponse>('/health');
  return response.data;
};

export default api;
