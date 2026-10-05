import JobAnalysis from '../models/JobAnalysis.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';

const MAX_PROFILE_SKILLS = 30;
const MAX_RESUME_ITEMS = 12;
const MAX_RESUME_SUGGESTIONS = 12;
const MAX_JOB_SKILLS = 20;
const MAX_JOB_GAPS = 12;
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

export function createCareerContextService({
  userModel = User,
  resumeModel = ResumeAnalysis,
  jobModel = JobAnalysis,
} = {}) {
  return {
    async buildForUser(authenticatedUser) {
      const user = await userModel.findById(authenticatedUser.id);
      if (!user) {
        const error = new Error('Authenticated user was not found');
        error.status = 404;
        throw error;
      }
      const [resume, job] = await Promise.all([
        resumeModel.findOne({ user: authenticatedUser.id }).sort({ createdAt: -1 })
          .select('detectedSkills detectedEducation detectedExperience detectedProjects missingSections improvementSuggestions'),
        jobModel.findOne({ user: authenticatedUser.id }).sort({ createdAt: -1 }),
      ]);
      const profile = user.profile;

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
        latestJobTitle: cleanText(job?.jobTitle),
        latestJobCompany: cleanText(job?.companyName),
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
      };
    },
  };
}