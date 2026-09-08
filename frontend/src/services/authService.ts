import api from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
} from '../types';

/**
 * Register a new user.
 * POST /auth/register
 *
 * @returns The newly created user record, including `createdAt`.
 */
export const registerUser = async (
  data: RegisterRequest,
): Promise<UserResponse> => {
  const response = await api.post<UserResponse>('/auth/register', data);
  return response.data;
};

/**
 * Authenticate an existing user.
 * POST /auth/login
 *
 * @returns LoginResponse containing user details and a `message` field.
 */
export const loginUser = async (
  data: LoginRequest,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
};
