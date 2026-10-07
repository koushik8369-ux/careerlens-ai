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
  id: string;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  message: string;
  token: string;
}

export interface User {
  id: string;
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
  userId: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardResponse {
  userId: string;
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
  id: string;
  fileName: string;
  fileType: string | null;
  overallScore: number;
  scoreBreakdown: {
    contactInformation: number;
    summary: number;
    skills: number;
    targetKeywords: number;
    experience: number;
    education: number;
    projects: number;
    certifications: number;
    completeness: number;
  };
  targetRole?: string;
  matchScore?: number;
  detectedName: string | null;
  detectedEmail: string | null;
  detectedPhone: string | null;
  detectedSummary: string | null;
  detectedSkills: string[];
  skillCategories: Array<{ category: string; skills: string[] }>;
  strongSkills: string[];
  detectedEducation: string[];
  detectedExperience: string[];
  detectedProjects: string[];
  detectedCertifications: string[];
  missingSections: string[];
  atsAnalysis: {
    score: number;
    scoreBreakdown: ResumeAnalysisResponse['scoreBreakdown'];
    missingSections: string[];
    weakSections: string[];
    contactInformation: {
      emailPresent: boolean;
      phonePresent: boolean;
      complete: boolean;
    };
    summaryQuality: 'missing' | 'brief' | 'present';
    keywordCoverage: {
      targetRole: string[];
      matched: string[];
      missing: string[];
      jobMarketGaps: string[];
      percentage: number;
    };
    actionVerbs: {
      detected: boolean;
      matches: string[];
    };
    quantifiedAchievements: {
      detected: boolean;
      examples: string[];
    };
    contentIssues: string[];
  };
  jobMarketInsights: {
    status: 'available' | 'unavailable' | 'pending';
    message: string | null;
    totalMatches: number;
    suitableRoles: Array<{ title: string; jobCount: number }>;
    commonSkills: Array<{ skill: string; jobCount: number }>;
    skillGaps: Array<{ skill: string; jobCount: number }>;
    jobs: JobRecommendation[];
  };
  weakAreas: string[];
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
  id: string;
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

export interface JobRecommendation {
  jobId: string;
  title: string;
  companyName: string | null;
  location: string | null;
  experience: string | null;
  salary: string | null;
  currency: string | null;
  minimumExperience: number | null;
  maximumExperience: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
  matchPercentage: number;
  skillMatchPercent: number;
  experienceCompatibilityPercent: number;
  locationRelevancePercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  jobDescription: string | null;
  aggregateRating: number | null;
  reviewsCount: number | null;
}

export interface JobRecommendationsResponse {
  resumeAnalysisId: string;
  totalMatches: number;
  scoreFormula: string;
  jobs: JobRecommendation[];
}

// ── Phase 5: Career Assistant & Career Plan ────────────────────────────────

export interface CareerAssistantConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type CareerAssistantMessageRole = 'USER' | 'ASSISTANT';

export interface CareerAssistantMessage {
  id: string;
  role: CareerAssistantMessageRole;
  content: string;
  provider: string | null;
  followUpSuggestions: string[];
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
  id: string;
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
  id: string;
  sourceResumeAnalysisId: string | null;
  sourceJobAnalysisId: string | null;
  careerGoal: string | null;
  status: CareerPlanStatus;
  createdAt: string;
  updatedAt: string;
  items: CareerPlanItem[];
}

export interface CareerPlanItemUpdateRequest {
  completed: boolean;
}
