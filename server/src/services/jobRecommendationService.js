import mongoose from 'mongoose';
import JobPosting from '../models/JobPosting.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';
import { JOB_DATASET_ID, normalizeSkill } from './jobDatasetService.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;
const SCORE_WEIGHTS = {
  skills: 0.7,
  experience: 0.2,
  location: 0.1,
};

function clientError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function estimateExperienceYears(detectedExperience = []) {
  for (const entry of detectedExperience) {
    const match = /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b/i.exec(entry);
    if (match) return Number(match[1]);
  }
  return null;
}

function locationScore(profileLocation, jobLocation) {
  const applicantLocation = normalizeSkill(profileLocation).replace(/[^a-z0-9 ]/g, ' ').trim();
  const postingLocation = normalizeSkill(jobLocation).replace(/[^a-z0-9 ]/g, ' ').trim();
  if (!applicantLocation || !postingLocation) return 50;
  return postingLocation.includes(applicantLocation) || applicantLocation.includes(postingLocation) ? 100 : 0;
}

function experienceScore(applicantYears, jobMinimumYears) {
  if (applicantYears == null || jobMinimumYears == null) return 50;
  if (jobMinimumYears <= 0) return 100;
  return Math.min(100, Math.round((applicantYears / jobMinimumYears) * 100));
}

function mapRecommendation(job, resumeSkillSet, applicantYears, applicantLocation) {
  const normalizedSkills = [...new Set((job.normalizedSkills ?? []).map(normalizeSkill).filter(Boolean))];
  const matchedKeys = new Set(normalizedSkills.filter((skill) => resumeSkillSet.has(skill)));
  const skillMatchPercent = normalizedSkills.length === 0
    ? 0
    : Math.round((matchedKeys.size / normalizedSkills.length) * 100);
  const matchedSkills = [];
  const missingSkills = [];

  for (const [index, skill] of (job.skillNames ?? []).entries()) {
    if (matchedKeys.has(normalizeSkill(skill))) matchedSkills.push(skill);
    else missingSkills.push(skill);
    if (index >= normalizedSkills.length - 1) break;
  }

  const experienceCompatibilityPercent = experienceScore(applicantYears, job.minimumExperience);
  const locationRelevancePercent = locationScore(applicantLocation, job.location);
  const matchPercentage = Math.round(
    SCORE_WEIGHTS.skills * skillMatchPercent
      + SCORE_WEIGHTS.experience * experienceCompatibilityPercent
      + SCORE_WEIGHTS.location * locationRelevancePercent,
  );

  return {
    jobId: job.jobId,
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    experience: job.experience,
    salary: job.salary,
    currency: job.currency,
    minimumExperience: job.minimumExperience,
    maximumExperience: job.maximumExperience,
    minimumSalary: job.minimumSalary,
    maximumSalary: job.maximumSalary,
    matchPercentage,
    skillMatchPercent,
    experienceCompatibilityPercent,
    locationRelevancePercent,
    matchedSkills,
    missingSkills,
    jobDescription: job.jobDescription,
    aggregateRating: job.aggregateRating,
    reviewsCount: job.reviewsCount,
  };
}

function compareRecommendations(left, right) {
  return right.matchPercentage - left.matchPercentage
    || right.skillMatchPercent - left.skillMatchPercent
    || right.matchedSkills.length - left.matchedSkills.length
    || left.title.localeCompare(right.title);
}

function scoreFormula() {
  return '70% skill match + 20% experience compatibility + 10% location relevance';
}

export function createJobRecommendationService({
  jobPostingModel = JobPosting,
  resumeModel = ResumeAnalysis,
  userModel = User,
} = {}) {
  return {
    async getRecommendedJobs(authenticatedUser, { resumeAnalysisId, limit = DEFAULT_LIMIT }) {
      if (!mongoose.isObjectIdOrHexString(resumeAnalysisId)) {
        throw clientError(400, 'A valid resume analysis ID is required.');
      }
      const resultLimit = limit == null || limit === '' ? DEFAULT_LIMIT : Number(limit);
      if (!Number.isInteger(resultLimit) || resultLimit < 1 || resultLimit > MAX_LIMIT) {
        throw clientError(400, `Limit must be between 1 and ${MAX_LIMIT}.`);
      }

      const resume = await resumeModel.findOne({
        _id: resumeAnalysisId,
        user: authenticatedUser.id,
      }).select('detectedSkills detectedExperience');
      if (!resume) throw clientError(404, 'Resume analysis not found.');

      const user = await userModel.findById(authenticatedUser.id);
      if (!user) throw clientError(404, 'Authenticated user was not found.');

      const datasetAvailable = await jobPostingModel.exists({ sourceDataset: JOB_DATASET_ID });
      if (!datasetAvailable) {
        throw clientError(503, 'Job recommendations are not available because the job dataset has not been imported.');
      }

      const resumeSkillSet = new Set((resume.detectedSkills ?? []).map(normalizeSkill).filter(Boolean));
      if (resumeSkillSet.size === 0) {
        return {
          resumeAnalysisId: String(resumeAnalysisId),
          totalMatches: 0,
          scoreFormula: scoreFormula(),
          jobs: [],
        };
      }

      const cursor = jobPostingModel.find({
        sourceDataset: JOB_DATASET_ID,
        normalizedSkills: { $in: [...resumeSkillSet] },
      })
        .select([
          'jobId', 'title', 'companyName', 'location', 'experience', 'salary', 'currency',
          'minimumExperience', 'maximumExperience', 'minimumSalary', 'maximumSalary',
          'normalizedSkills', 'skillNames', 'jobDescription', 'aggregateRating', 'reviewsCount',
        ].join(' '))
        .lean()
        .cursor();
      const applicantYears = estimateExperienceYears(resume.detectedExperience);
      const applicantLocation = user.profile?.location;
      const topJobs = [];
      let totalMatches = 0;

      for await (const job of cursor) {
        const recommendation = mapRecommendation(job, resumeSkillSet, applicantYears, applicantLocation);
        if (recommendation.matchedSkills.length === 0) continue;
        totalMatches += 1;
        topJobs.push(recommendation);
        topJobs.sort(compareRecommendations);
        if (topJobs.length > resultLimit) topJobs.pop();
      }

      return {
        resumeAnalysisId: String(resumeAnalysisId),
        totalMatches,
        scoreFormula: scoreFormula(),
        jobs: topJobs,
      };
    },
  };
}
