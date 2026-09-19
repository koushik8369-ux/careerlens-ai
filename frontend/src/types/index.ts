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

// ── Phase 4: Job & Career Intelligence ─────────────────────────────────────

export interface JobAnalysisRequest {
  jobTitle?: string;
  companyName?: string;
  jobDescription: string;
}

export type SkillPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SkillGap {
  skill: string;
  priority: SkillPriority;
  explanation: string;
}

export type RecommendationCategory = 'LEARNING' | 'PROJECT' | 'PREPARATION';

export interface CareerRecommendation {
  category: RecommendationCategory;
  title: string;
  description: string;
}

export type QuestionCategory = 'TECHNICAL' | 'BEHAVIORAL' | 'PROJECT';

export interface InterviewQuestion {
  question: string;
  category: QuestionCategory;
  rationale: string;
}

export interface JobAnalysisResponse {
  id: number;
  jobTitle: string;
  companyName: string;
  rawJobDescription: string;
  overallMatchScore: number;
  requiredSkillMatchPercent: number;
  preferredSkillMatchPercent: number;
  requiredSkills: string[];
  preferredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  skillGaps: SkillGap[];
  recommendations: CareerRecommendation[];
  interviewQuestions: InterviewQuestion[];
  createdAt: string;
}

// ── Phase 5: Career Assistant & Career Plan ────────────────────────────────

export interface CareerAssistantConversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type CareerAssistantMessageRole = 'USER' | 'ASSISTANT';

export interface CareerAssistantMessage {
  id: number;
  role: CareerAssistantMessageRole;
  content: string;
  provider: string | null;
  createdAt: string;
}

export interface CareerAssistantMessageRequest {
  question: string;
}

export type CareerAssistantMessageResponse = CareerAssistantMessage;

export interface ResumeImprovementResult {
  weakAreas: string[];
  missingContent: string[];
  strongerWordingSuggestions: string[];
}

export interface CareerRoadmapStage {
  name: string;
  objective: string;
  actions: string[];
  skills: string[];
}

export interface CareerRoadmapResult {
  stages: CareerRoadmapStage[];
}

export interface ProjectRecommendation {
  title: string;
  description: string;
  skills: string[];
  rationale: string;
}

export interface ProjectRecommendationResult {
  recommendations: ProjectRecommendation[];
}

export interface InterviewPreparationResult {
  technicalTopics: string[];
  behavioralQuestions: string[];
  projectTalkingPoints: string[];
}

export interface CareerActionPlanResult {
  actions: string[];
}

export type CareerPlanStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type CareerPlanCategory = 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
export type CareerPlanItemType = 'LEARNING' | 'PROJECT' | 'INTERVIEW' | 'RESUME';

export interface CareerPlanItem {
  id: number;
  category: CareerPlanCategory;
  itemType: CareerPlanItemType;
  title: string;
  description: string | null;
  skills: string[];
  priority: string;
  completed: boolean;
  sortOrder: number;
}

export interface CareerPlan {
  id: number;
  sourceResumeAnalysisId: number | null;
  sourceJobAnalysisId: number | null;
  careerGoal: string | null;
  status: CareerPlanStatus;
  createdAt: string;
  updatedAt: string;
  items: CareerPlanItem[];
}

export interface CareerPlanItemUpdateRequest {
  completed: boolean;
}
