export interface HealthStatusResponse {
  status: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  id: number;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  message: string;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

/** Shape returned by POST /auth/register — mirrors the backend UserResponse DTO. */
export interface UserResponse extends User {
  createdAt: string;
}

/** Runtime authenticated user stored in AuthContext / localStorage. */
export type AuthUser = User;

/** Unified auth response type — mirrors LoginResponse from the backend. */
export type AuthResponse = LoginResponse;
