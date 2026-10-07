import mongoose from 'mongoose';
import CareerPlan from '../models/CareerPlan.js';
import JobAnalysis from '../models/JobAnalysis.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';
import { createCareerAiProvider } from './careerAiProvider.js';
import { createCareerContextService } from './careerContextService.js';

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function responseFromPlan(plan) {
  const items = [...(plan.items ?? [])]
    .sort((left, right) => left.sortOrder - right.sortOrder || String(left._id).localeCompare(String(right._id)))
    .map((item) => ({
      id: String(item._id ?? item.id),
      category: item.category,
      itemType: item.itemType,
      title: item.title,
      description: item.description ?? null,
      skills: [...(item.skills ?? [])],
      priority: item.priority,
      completed: item.completed,
      status: item.completed ? 'COMPLETED' : item.status ?? 'NOT_STARTED',
      sortOrder: item.sortOrder,
    }));
  const completedItems = items.filter((item) => item.status === 'COMPLETED').length;
  const inProgressItems = items.filter((item) => item.status === 'IN_PROGRESS').length;
  const remainingItems = items.length - completedItems;
  const currentStage = items.find((item) => item.status !== 'COMPLETED')?.category ?? null;
  return {
    id: String(plan._id ?? plan.id),
    sourceResumeAnalysisId: plan.sourceResumeAnalysis == null ? null : String(plan.sourceResumeAnalysis),
    sourceJobAnalysisId: plan.sourceJobAnalysis == null ? null : String(plan.sourceJobAnalysis),
    careerGoal: plan.careerGoal ?? null,
    status: plan.status,
    progress: {
      totalItems: items.length,
      completedItems,
      inProgressItems,
      remainingItems,
      completionPercent: items.length === 0 ? 0 : Math.round((completedItems / items.length) * 100),
      currentStage,
    },
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    items,
  };
}

function targetRoleFor(context) {
  return context.careerGoal ?? context.resumeTargetRole ?? context.latestJobTitle ?? null;
}

function hasCareerEvidence(context) {
  return [
    context.skills,
    context.resumeDetectedSkills,
    context.resumeExperience,
    context.resumeProjects,
    context.resumeJobFitMissingSkills,
    context.latestJobRequiredSkills,
    context.latestJobPreferredSkills,
    context.latestJobMissingSkills,
    context.latestJobSkillGaps.map((gap) => gap.skill),
    context.jobMarketSkillGaps.map((gap) => gap.skill),
  ].some((values) => Array.isArray(values) && values.length > 0);
}

function skillEvidence(skill, context, targetRole) {
  const evidence = [];
  const latestJobGaps = context.latestJobSkillGaps.filter((gap) => gap.skill?.toLowerCase() === skill.toLowerCase());
  const isJobRequirement = context.latestJobRequiredSkills.some((item) => item.toLowerCase() === skill.toLowerCase());
  const isJobPreference = context.latestJobPreferredSkills.some((item) => item.toLowerCase() === skill.toLowerCase());
  if (isJobRequirement || latestJobGaps.some((gap) => gap.priority === 'HIGH')) {
    evidence.push(`identified as a required skill gap in your latest Job Intelligence analysis${context.latestJobTitle ? ` for ${context.latestJobTitle}` : ''}`);
  } else if (isJobPreference || latestJobGaps.length > 0) {
    evidence.push(`identified as a preferred skill gap in your latest Job Intelligence analysis${context.latestJobTitle ? ` for ${context.latestJobTitle}` : ''}`);
  } else if (context.resumeJobFitMissingSkills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
    evidence.push(`listed as missing in your saved resume job-fit analysis${context.resumeTargetRole ? ` for ${context.resumeTargetRole}` : ''}`);
  }

  const marketGap = context.jobMarketSkillGaps.find((item) => item.skill.toLowerCase() === skill.toLowerCase());
  const marketSkill = context.jobMarketCommonSkills.find((item) => item.skill.toLowerCase() === skill.toLowerCase());
  const marketCount = marketGap?.jobCount ?? marketSkill?.jobCount;
  if (context.jobMarketStatus === 'available' && marketCount !== undefined) {
    evidence.push(`appeared in ${marketCount} recommendation${marketCount === 1 ? '' : 's'} in your saved job-market snapshot`);
  }
  if (evidence.length === 0) evidence.push(`selected from your recorded skills as practice for ${targetRole}`);
  return `Why this matters: ${evidence.join('; ')}.`;
}

function itemTypeFor(action) {
  const normalized = action.toLowerCase();
  if (normalized.includes('resume')) return 'RESUME';
  if (normalized.includes('interview')) return 'INTERVIEW';
  if (normalized.includes('project')) return 'PROJECT';
  return 'LEARNING';
}

function categoryFor(name) {
  const category = String(name).trim().toUpperCase();
  return ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'].includes(category) ? category : 'LONG_TERM';
}

function priorityFor(category) {
  if (category === 'SHORT_TERM') return 'HIGH';
  if (category === 'MEDIUM_TERM') return 'MEDIUM';
  return 'LOW';
}

export function createCareerPlanService({
  planModel = CareerPlan,
  resumeModel = ResumeAnalysis,
  jobModel = JobAnalysis,
  userModel = User,
  contextService,
  aiProvider = createCareerAiProvider(),
} = {}) {
  const resolvedContextService = contextService ?? createCareerContextService({
    userModel,
    resumeModel,
    jobModel,
    planModel,
  });
  async function getOwnedPlan(user, id) {
    if (!mongoose.isObjectIdOrHexString(id)) throw createError('Career plan was not found', 404);
    const plan = await planModel.findOne({ _id: id, user: user.id });
    if (!plan) throw createError(`Career plan was not found with id: ${id}`, 404);
    return plan;
  }

  return {
    async generate(user) {
      const context = await resolvedContextService.buildForUser(user);
      const targetRole = targetRoleFor(context);
      if (!targetRole || !hasCareerEvidence(context)) {
        throw createError('Not enough information yet. Add a target role to your profile and provide skills, a resume analysis, or a job-fit analysis before generating a personalized plan.', 400);
      }
      const planningContext = { ...context, careerGoal: targetRole };
      let providerRoadmap;
      try {
        providerRoadmap = await aiProvider.generateCareerRoadmap(planningContext);
      } catch (cause) {
        if (cause?.cause?.startsWith?.('AI_PROVIDER_')) throw createError(cause.message, 503);
        throw cause;
      }
      if (!Array.isArray(providerRoadmap?.stages)
          || !providerRoadmap.stages.some((stage) => Array.isArray(stage.actions) && stage.actions.length > 0)) {
        throw createError('Not enough information yet to create actionable career-plan items.', 400);
      }

      const previous = await planModel.findOne({ user: user.id, status: 'ACTIVE' }).sort({ updatedAt: -1 });
      if (previous) {
        previous.status = 'ARCHIVED';
        previous.updatedAt = new Date();
        await previous.save();
      }

      const [resume, job] = await Promise.all([
        resumeModel.findOne({ user: user.id }).sort({ createdAt: -1 }).select('_id'),
        jobModel.findOne({ user: user.id }).sort({ createdAt: -1 }).select('_id'),
      ]);
      let sortOrder = 0;
      const items = [];
      for (const stage of providerRoadmap.stages) {
        const category = categoryFor(stage.name);
        for (const action of stage.actions) {
          const skills = [...stage.skills];
          items.push({
            category,
            itemType: itemTypeFor(action),
            title: action,
            description: [
              stage.objective,
              ...skills.map((skill) => skillEvidence(skill, planningContext, targetRole)),
            ].join(' '),
            skills,
            priority: priorityFor(category),
            completed: false,
            status: 'NOT_STARTED',
            sortOrder: sortOrder++,
          });
        }
      }

      const plan = await planModel.create({
        user: user.id,
        sourceResumeAnalysis: resume?._id ?? null,
        sourceJobAnalysis: job?._id ?? null,
        careerGoal: targetRole,
        status: 'ACTIVE',
        items,
      });
      return responseFromPlan(plan);
    },

    async getCurrent(user) {
      const plan = await planModel.findOne({ user: user.id, status: 'ACTIVE' }).sort({ updatedAt: -1 });
      if (!plan) throw createError('Current career plan was not found', 404);
      return responseFromPlan(plan);
    },

    async getById(user, id) {
      return responseFromPlan(await getOwnedPlan(user, id));
    },

    async updateItem(user, id, itemId, update) {
      const plan = await getOwnedPlan(user, id);
      if (!mongoose.isObjectIdOrHexString(itemId)) {
        throw createError(`Career plan item was not found with id: ${itemId}`, 404);
      }
      const item = plan.items.id(itemId);
      if (!item) throw createError(`Career plan item was not found with id: ${itemId}`, 404);
      if (typeof update?.completed === 'boolean') {
        item.completed = update.completed;
        item.status = update.completed ? 'COMPLETED' : 'NOT_STARTED';
      } else if (['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(update?.status)) {
        item.status = update.status;
        item.completed = update.status === 'COMPLETED';
      } else {
        throw createError('Provide a valid completed flag or item status', 400);
      }
      plan.updatedAt = new Date();
      await plan.save();
      return responseFromPlan(plan);
    },
  };
}