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
  token: string;
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

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export interface UserProfileRequest {
  phone: string | null;
  education: string | null;
  college: string | null;
  graduationYear: number | null;
  careerGoal: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
}

export interface UserProfileResponse extends UserProfileRequest {
  userId: number;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardResponse {
  userId: number;
  fullName: string;
  email: string;
  careerGoal: string | null;
  education: string | null;
  profileCompletionPercentage: number;
  skillCount: number;
  profileStatus: 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED' | string;
}

/** Unified auth response type — mirrors LoginResponse from the backend. */
export type AuthResponse = LoginResponse;

export interface ResumeAnalysisResponse {
  id: number;
  fileName: string;
  fileType: string;
  overallScore: number;
  targetRole?: string;
  matchScore?: number;
  detectedSkills: string[];
  detectedEducation: string[];
  detectedExperience: string[];
  detectedProjects: string[];
  missingSections: string[];
  improvementSuggestions: string[];
  createdAt: string;
}
