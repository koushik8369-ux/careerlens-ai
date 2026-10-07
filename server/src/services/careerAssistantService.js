import mongoose from 'mongoose';
import CareerAssistantConversation from '../models/CareerAssistantConversation.js';
import CareerAssistantMessage from '../models/CareerAssistantMessage.js';
import CareerPlan from '../models/CareerPlan.js';
import JobAnalysis from '../models/JobAnalysis.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';
import { createCareerAiProvider } from './careerAiProvider.js';
import { createCareerContextService } from './careerContextService.js';

const DEFAULT_TITLE = 'Career Assistant';
const MAX_QUESTION_LENGTH = 2000;

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function conversationResponse(conversation) {
  return {
    id: String(conversation._id ?? conversation.id),
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function messageResponse(message) {
  return {
    id: String(message._id ?? message.id),
    role: message.role,
    content: message.content,
    provider: message.provider ?? null,
    followUpSuggestions: Array.isArray(message.followUpSuggestions)
      ? message.followUpSuggestions.filter((item) => typeof item === 'string').slice(0, 4)
      : [],
    createdAt: message.createdAt,
  };
}

export function createCareerAssistantService({
  conversationModel = CareerAssistantConversation,
  messageModel = CareerAssistantMessage,
  contextService,
  userModel = User,
  resumeModel = ResumeAnalysis,
  jobModel = JobAnalysis,
  planModel = CareerPlan,
  aiProvider,
  env = process.env,
  fetchImpl,
} = {}) {
  const resolvedContextService = contextService ?? createCareerContextService({
    userModel,
    resumeModel,
    jobModel,
    planModel,
  });
  let provider = aiProvider;
  function getProvider() {
    provider ??= createCareerAiProvider({ env, fetchImpl });
    return provider;
  }

  async function getOwnedConversation(user, conversationId) {
    if (!mongoose.isObjectIdOrHexString(conversationId)) {
      throw createError('Conversation was not found', 404);
    }
    const conversation = await conversationModel.findOne({ _id: conversationId, user: user.id });
    if (!conversation) throw createError(`Conversation was not found with id: ${conversationId}`, 404);
    return conversation;
  }

  async function withContext(user, method, ...args) {
    const [context, selectedProvider] = await Promise.all([
      resolvedContextService.buildForUser(user),
      Promise.resolve(getProvider()),
    ]);
    try {
      return await selectedProvider[method](context, ...args);
    } catch (cause) {
      if (cause?.cause?.startsWith?.('AI_PROVIDER_')) {
        throw createError(cause.message, 503);
      }
      throw cause;
    }
  }

  return {
    async createConversation(user) {
      const conversation = await conversationModel.create({ user: user.id, title: DEFAULT_TITLE });
      return conversationResponse(conversation);
    },

    async getConversations(user) {
      const conversations = await conversationModel.find({ user: user.id }).sort({ updatedAt: -1 });
      return conversations.map(conversationResponse);
    },

    async getMessages(user, conversationId) {
      const conversation = await getOwnedConversation(user, conversationId);
      const messages = await messageModel.find({ conversation: conversation._id }).sort({ createdAt: 1, _id: 1 });
      return messages.map(messageResponse);
    },

    async sendMessage(user, conversationId, question) {
      const conversation = await getOwnedConversation(user, conversationId);
      if (typeof question !== 'string' || question.trim().length === 0) {
        throw createError('Question must not be blank', 400);
      }
      const normalizedQuestion = question.trim();
      if (normalizedQuestion.length > MAX_QUESTION_LENGTH) {
        throw createError(`Question must not exceed ${MAX_QUESTION_LENGTH} characters`, 400);
      }

      const previousMessages = await messageModel.find({ conversation: conversation._id })
        .sort({ createdAt: 1, _id: 1 });
      const conversationHistory = previousMessages.slice(-10).map((message) => ({
        role: message.role === 'USER' ? 'user' : 'assistant',
        content: typeof message.content === 'string' ? message.content.slice(0, 4000) : '',
      }));
      const answer = await withContext(user, 'answerCareerQuestion', normalizedQuestion, conversationHistory);
      const selectedProvider = getProvider();
      const providerName = typeof selectedProvider.providerName === 'function'
        ? selectedProvider.providerName() || 'deterministic'
        : 'deterministic';
      await messageModel.create({ conversation: conversation._id, role: 'USER', content: normalizedQuestion, provider: null });
      const assistantMessage = await messageModel.create({
        conversation: conversation._id,
        role: 'ASSISTANT',
        content: answer.answer,
        provider: providerName,
        followUpSuggestions: Array.isArray(answer.followUpSuggestions)
          ? answer.followUpSuggestions.filter((item) => typeof item === 'string').slice(0, 4)
          : [],
      });

      if (conversation.title === DEFAULT_TITLE) {
        conversation.title = normalizedQuestion.length <= 200
          ? normalizedQuestion
          : `${normalizedQuestion.slice(0, 197)}...`;
      }
      conversation.updatedAt = new Date();
      await conversation.save();
      return messageResponse(assistantMessage);
    },

    generateActionPlan: (user) => withContext(user, 'generateActionPlan'),
    improveResume: (user) => withContext(user, 'improveResume'),
    generateRoadmap: (user) => withContext(user, 'generateCareerRoadmap'),
    recommendProjects: (user) => withContext(user, 'recommendProjects'),
    prepareForInterview: (user) => withContext(user, 'prepareForInterview'),
  };
}