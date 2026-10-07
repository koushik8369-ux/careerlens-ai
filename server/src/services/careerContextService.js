import CareerPlan from '../models/CareerPlan.js';
import JobAnalysis from '../models/JobAnalysis.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';

const MAX_PROFILE_SKILLS = 30;
const MAX_RESUME_ITEMS = 12;
const MAX_RESUME_SUGGESTIONS = 12;
const MAX_JOB_SKILLS = 20;
const MAX_JOB_GAPS = 12;
const MAX_MARKET_ITEMS = 8;
const MAX_PLAN_ITEMS = 12;
const MAX_BIO_LENGTH = 1000;
const MAX_ITEM_LENGTH = 1000;

function cleanText(value, maximumLength = MAX_ITEM_LENGTH) {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  return value.trim().slice(0, maximumLength);
}

function limitStrings(values, maximumItems) {
  if (!Array.isArray(values)) return [];
  const unique = new Set();
  for (const value of values) {
    const cleaned = cleanText(value);
    if (cleaned) unique.add(cleaned);
    if (unique.size >= maximumItems) break;
  }
  return [...unique];
}

function countValue(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function scoreValue(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}

function countItems(values, maximumItems, labelField) {
  if (!Array.isArray(values)) return [];
  return values.slice(0, maximumItems).flatMap((item) => {
    const label = cleanText(item?.[labelField], 120);
    const count = countValue(item?.jobCount);
    return label && count !== null ? [{ [labelField]: label, jobCount: count }] : [];
  });
}

export function createCareerContextService({
  userModel = User,
  resumeModel = ResumeAnalysis,
  jobModel = JobAnalysis,
  planModel = CareerPlan,
} = {}) {
  return {
    async buildForUser(authenticatedUser) {
      const user = await userModel.findById(authenticatedUser.id);
      if (!user) {
        const error = new Error('Authenticated user was not found');
        error.status = 404;
        throw error;
      }
      const [resume, job, plan] = await Promise.all([
        resumeModel.findOne({ user: authenticatedUser.id }).sort({ createdAt: -1 })
          .select('targetRole matchScore detectedSkills detectedEducation detectedExperience detectedProjects missingSections improvementSuggestions jobMarketInsights jobSpecificAnalysis'),
        jobModel.findOne({ user: authenticatedUser.id }).sort({ createdAt: -1 }),
        planModel.findOne({ user: authenticatedUser.id, status: 'ACTIVE' }).sort({ updatedAt: -1 })
          .select('careerGoal status items'),
      ]);
      const profile = user.profile;
      const market = resume?.jobMarketInsights;
      const resumeJobFit = resume?.jobSpecificAnalysis;
      const marketAvailable = market?.status === 'available';

      return {
        careerGoal: cleanText(profile?.careerGoal),
        skills: limitStrings(profile?.skills, MAX_PROFILE_SKILLS),
        education: cleanText(profile?.education),
        college: cleanText(profile?.college),
        graduationYear: profile?.graduationYear ?? null,
        bio: cleanText(profile?.bio, MAX_BIO_LENGTH),
        resumeDetectedSkills: limitStrings(resume?.detectedSkills, MAX_RESUME_ITEMS),
        resumeEducation: limitStrings(resume?.detectedEducation, MAX_RESUME_ITEMS),
        resumeExperience: limitStrings(resume?.detectedExperience, MAX_RESUME_ITEMS),
        resumeProjects: limitStrings(resume?.detectedProjects, MAX_RESUME_ITEMS),
        resumeMissingSections: limitStrings(resume?.missingSections, MAX_RESUME_ITEMS),
        resumeSuggestions: limitStrings(resume?.improvementSuggestions, MAX_RESUME_SUGGESTIONS),
        resumeTargetRole: cleanText(resume?.targetRole),
        resumeJobFitScore: scoreValue(resume?.matchScore ?? resumeJobFit?.jobFitScore),
        resumeJobFitRequiredSkills: limitStrings(resumeJobFit?.requiredSkills, MAX_JOB_SKILLS),
        resumeJobFitMatchedSkills: limitStrings(resumeJobFit?.matchedSkills, MAX_JOB_SKILLS),
        resumeJobFitMissingSkills: limitStrings(resumeJobFit?.missingSkills, MAX_JOB_SKILLS),
        latestJobTitle: cleanText(job?.jobTitle),
        latestJobCompany: cleanText(job?.companyName),
        latestJobDescription: cleanText(job?.rawJobDescription, 4000),
        latestJobOverallScore: job?.overallMatchScore ?? null,
        latestJobRequiredSkills: limitStrings(job?.requiredSkills, MAX_JOB_SKILLS),
        latestJobPreferredSkills: limitStrings(job?.preferredSkills, MAX_JOB_SKILLS),
        latestJobMatchedSkills: limitStrings(job?.matchedSkills, MAX_JOB_SKILLS),
        latestJobMissingSkills: limitStrings(job?.missingSkills, MAX_JOB_SKILLS),
        latestJobSkillGaps: Array.isArray(job?.skillGaps)
          ? job.skillGaps.filter((gap) => gap && cleanText(gap.skill)).slice(0, MAX_JOB_GAPS).map((gap) => ({
            skill: cleanText(gap.skill),
            priority: cleanText(gap.priority, 32),
            explanation: cleanText(gap.explanation),
          }))
          : [],
        jobMarketStatus: market?.status === 'available' || market?.status === 'unavailable'
          ? market.status
          : 'unavailable',
        jobMarketTotalMatches: marketAvailable ? countValue(market.totalMatches) : null,
        jobMarketSuitableRoles: marketAvailable
          ? countItems(market.suitableRoles, MAX_MARKET_ITEMS, 'title')
          : [],
        jobMarketCommonSkills: marketAvailable
          ? countItems(market.commonSkills, MAX_MARKET_ITEMS, 'skill')
          : [],
        jobMarketSkillGaps: marketAvailable
          ? countItems(market.skillGaps, MAX_MARKET_ITEMS, 'skill')
          : [],
        activeCareerPlanGoal: cleanText(plan?.careerGoal, MAX_BIO_LENGTH),
        activeCareerPlanItems: Array.isArray(plan?.items)
          ? plan.items.slice(0, MAX_PLAN_ITEMS).flatMap((item) => {
            const title = cleanText(item?.title, 300);
            if (!title) return [];
            return [{
              category: cleanText(item.category, 32),
              itemType: cleanText(item.itemType, 32),
              title,
              skills: limitStrings(item.skills, MAX_JOB_SKILLS),
              completed: item.completed === true,
            }];
          })
          : [],
      };
    },
  };
}