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
  return {
    id: String(plan._id ?? plan.id),
    sourceResumeAnalysisId: plan.sourceResumeAnalysis == null ? null : String(plan.sourceResumeAnalysis),
    sourceJobAnalysisId: plan.sourceJobAnalysis == null ? null : String(plan.sourceJobAnalysis),
    careerGoal: plan.careerGoal ?? null,
    status: plan.status,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    items: [...(plan.items ?? [])]
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
        sortOrder: item.sortOrder,
      })),
  };
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
  const resolvedContextService = contextService ?? createCareerContextService({ userModel, resumeModel, jobModel });
  async function getOwnedPlan(user, id) {
    if (!mongoose.isObjectIdOrHexString(id)) throw createError('Career plan was not found', 404);
    const plan = await planModel.findOne({ _id: id, user: user.id });
    if (!plan) throw createError(`Career plan was not found with id: ${id}`, 404);
    return plan;
  }

  return {
    async generate(user) {
      const context = await resolvedContextService.buildForUser(user);
      let providerRoadmap;
      try {
        providerRoadmap = await aiProvider.generateCareerRoadmap(context);
      } catch (cause) {
        if (cause?.cause?.startsWith?.('AI_PROVIDER_')) throw createError(cause.message, 503);
        throw cause;
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
          items.push({
            category,
            itemType: itemTypeFor(action),
            title: action,
            description: stage.objective,
            skills: [...stage.skills],
            priority: priorityFor(category),
            completed: false,
            sortOrder: sortOrder++,
          });
        }
      }

      const plan = await planModel.create({
        user: user.id,
        sourceResumeAnalysis: resume?._id ?? null,
        sourceJobAnalysis: job?._id ?? null,
        careerGoal: context.careerGoal,
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

    async updateItem(user, id, itemId, completed) {
      const plan = await getOwnedPlan(user, id);
      if (!mongoose.isObjectIdOrHexString(itemId)) {
        throw createError(`Career plan item was not found with id: ${itemId}`, 404);
      }
      const item = plan.items.id(itemId);
      if (!item) throw createError(`Career plan item was not found with id: ${itemId}`, 404);
      if (typeof completed !== 'boolean') throw createError('completed must be a boolean', 400);
      item.completed = completed;
      plan.updatedAt = new Date();
      await plan.save();
      return responseFromPlan(plan);
    },
  };
}