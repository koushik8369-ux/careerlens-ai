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
const MAX_INTERVIEW_PROMPT_LENGTH = 1000;
const MAX_INTERVIEW_ANSWER_LENGTH = 5000;
const INTERVIEW_CATEGORIES = new Set([
  'TECHNICAL',
  'BEHAVIORAL',
  'RESUME_BASED',
  'PROJECT_BASED',
  'ROLE_SPECIFIC',
  'SITUATIONAL',
  'HR',
]);
const INTERVIEW_STOP_WORDS = new Set([
  'about', 'after', 'also', 'and', 'are', 'can', 'could', 'describe', 'does', 'explain',
  'for', 'from', 'have', 'how', 'into', 'that', 'the', 'their', 'then', 'this', 'through',
  'using', 'what', 'when', 'where', 'which', 'while', 'with', 'would', 'your',
]);

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

function uniqueText(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (typeof value !== 'string' || !value.trim()) return false;
    const key = value.trim().toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function includesText(value, expected) {
  return typeof value === 'string' && typeof expected === 'string'
    && expected.length > 0 && value.toLocaleLowerCase().includes(expected.toLocaleLowerCase());
}

function resumeEvidence(context) {
  return [
    ...context.resumeDetectedSkills,
    ...context.resumeEducation,
    ...context.resumeExperience,
    ...context.resumeProjects,
  ].filter((value) => typeof value === 'string' && value.trim());
}

function interviewReadiness(context) {
  const skills = uniqueText([...(context.skills ?? []), ...(context.resumeDetectedSkills ?? [])]);
  const gaps = uniqueText([
    ...(context.latestJobMissingSkills ?? []),
    ...(context.resumeJobFitMissingSkills ?? []),
    ...(context.latestJobSkillGaps ?? []).map((gap) => gap.skill),
  ]);
  const resumeItems = resumeEvidence(context);
  const role = context.latestJobTitle ?? context.careerGoal ?? context.resumeTargetRole;
  const hasSkillEvidence = skills.length > 0 || context.latestJobRequiredSkills.length > 0;
  const hasJobFitEvidence = context.latestJobRequiredSkills.length > 0
    || context.latestJobMatchedSkills.length > 0
    || context.latestJobMissingSkills.length > 0
    || context.resumeJobFitMissingSkills.length > 0
    || context.resumeJobFitScore !== null;
  const statusForSkills = !hasSkillEvidence
    ? 'NOT_ENOUGH_DATA'
    : gaps.length > 0 || context.latestJobMatchedSkills.length === 0 ? 'NEEDS_PRACTICE' : 'STRONG';
  const dimensions = [
    {
      name: 'Technical preparation',
      status: statusForSkills,
      evidence: skills.length || context.latestJobRequiredSkills.length
        ? `${uniqueText([...skills, ...context.latestJobRequiredSkills]).length} recorded skill${uniqueText([...skills, ...context.latestJobRequiredSkills]).length === 1 ? '' : 's'} can guide practice.`
        : 'No skills or job requirements are available yet.',
    },
    {
      name: 'Role knowledge',
      status: role
        ? context.latestJobDescription || context.latestJobRequiredSkills.length > 0
          ? gaps.length > 0 ? 'NEEDS_PRACTICE' : 'STRONG'
          : 'NEEDS_PRACTICE'
        : 'NOT_ENOUGH_DATA',
      evidence: role
        ? context.latestJobDescription
          ? `Target role: ${role}; a saved job description is available.`
          : `Target role: ${role}; no saved job description is available.`
        : 'No target role is saved.',
    },
    {
      name: 'Resume and project preparation',
      status: resumeItems.length === 0
        ? 'NOT_ENOUGH_DATA'
        : context.resumeProjects.length > 0 || context.resumeExperience.length > 0
          ? 'STRONG'
          : 'NEEDS_PRACTICE',
      evidence: context.resumeProjects.length || context.resumeExperience.length
        ? `${context.resumeProjects.length} resume project${context.resumeProjects.length === 1 ? '' : 's'} and ${context.resumeExperience.length} experience entr${context.resumeExperience.length === 1 ? 'y' : 'ies'} are available.`
        : resumeItems.length > 0 ? 'Resume evidence is available, but no project or experience entries were detected.' : 'No structured resume evidence is available.',
    },
    {
      name: 'Behavioral preparation',
      status: 'NOT_ENOUGH_DATA',
      evidence: 'No saved practice answers are available to assess behavioral readiness.',
    },
    {
      name: 'Skill-gap readiness',
      status: !hasJobFitEvidence
        ? 'NOT_ENOUGH_DATA'
        : gaps.length > 0 ? 'NEEDS_PRACTICE'
          : context.latestJobMatchedSkills.length > 0 || context.resumeJobFitScore !== null ? 'STRONG' : 'NEEDS_PRACTICE',
      evidence: gaps.length > 0
        ? `${gaps.length} skill gap${gaps.length === 1 ? '' : 's'} appear in saved job-fit data.`
        : hasJobFitEvidence ? 'No skill gaps were recorded in the available job-fit context.' : 'No saved job-fit assessment is available.',
    },
  ];
  const statuses = dimensions.map((dimension) => dimension.status);
  const overallStatus = statuses.includes('NEEDS_PRACTICE')
    ? 'NEEDS_PRACTICE'
    : statuses.filter((status) => status === 'STRONG').length >= 2
      ? 'STRONG'
      : 'NOT_ENOUGH_DATA';
  return { status: overallStatus, dimensions };
}

function interviewContextNotice(context, targetRole) {
  const missing = [];
  if (!targetRole) missing.push('a target role');
  if (resumeEvidence(context).length === 0) missing.push('structured resume evidence');
  if (!context.latestJobDescription) missing.push('a saved job description');
  return missing.length > 0
    ? `Preparation is limited because some context is unavailable (missing: ${missing.join(', ')}). Questions that need it are omitted.`
    : null;
}

function enrichInterviewPreparation(context, result) {
  const targetRole = context.latestJobTitle ?? context.careerGoal ?? context.resumeTargetRole ?? null;
  const evidence = resumeEvidence(context);
  const recordedSkills = uniqueText([
    ...(context.latestJobRequiredSkills ?? []),
    ...(context.latestJobPreferredSkills ?? []),
    ...(context.skills ?? []),
    ...(context.resumeDetectedSkills ?? []),
  ]);
  const candidates = Array.isArray(result.questions) ? result.questions : [];
  const questions = [];
  const seenQuestions = new Set();

  for (const candidate of candidates) {
    if (!INTERVIEW_CATEGORIES.has(candidate?.category)
        || typeof candidate.question !== 'string'
        || !candidate.question.trim()
        || candidate.question.trim().length > 700) continue;
    const questionText = candidate.question.trim();
    let rationale;
    if (candidate.category === 'TECHNICAL') {
      const skill = recordedSkills.find((item) => includesText(questionText, item));
      if (!skill) continue;
      rationale = `Based on ${skill}, which is recorded in your profile, resume analysis, or latest job analysis.`;
    } else if (candidate.category === 'ROLE_SPECIFIC') {
      if (!targetRole || !includesText(questionText, targetRole)) continue;
      rationale = `Based on your saved target role${context.latestJobRequiredSkills.length ? ' and latest job requirements' : ''}.`;
    } else if (candidate.category === 'RESUME_BASED') {
      const reference = evidence.find((item) => includesText(questionText, item));
      if (!reference) continue;
      rationale = `References “${reference}” from your saved resume analysis.`;
    } else if (candidate.category === 'PROJECT_BASED') {
      const project = context.resumeProjects.find((item) => includesText(questionText, item));
      if (!project) continue;
      rationale = `References “${project}” detected in your saved resume analysis.`;
    } else {
      rationale = 'General practice prompt; use an example that reflects your actual experience.';
    }
    const key = `${candidate.category}:${questionText.toLocaleLowerCase()}`;
    if (seenQuestions.has(key)) continue;
    seenQuestions.add(key);
    questions.push({
      id: `question-${questions.length + 1}`,
      category: candidate.category,
      question: questionText,
      rationale,
    });
    if (questions.length >= 18) break;
  }

  const skillGaps = uniqueText([
    ...(context.latestJobMissingSkills ?? []),
    ...(context.resumeJobFitMissingSkills ?? []),
    ...(context.latestJobSkillGaps ?? []).map((gap) => gap.skill),
  ]);
  const practiceAreas = skillGaps.length
    ? [`Practice explaining how you would build competence in these recorded gaps: ${skillGaps.slice(0, 5).join(', ')}.`]
    : [];
  for (const item of (context.activeCareerPlanItems ?? []).filter((entry) => !entry.completed).slice(0, 5)) {
    practiceAreas.push(item.itemType === 'PROJECT'
      ? `When you complete the planned project “${item.title}”, prepare to explain its design and implementation. It is a plan item, not evidence of a completed project.`
      : `Career Plan practice: ${item.title}.`);
  }
  if (practiceAreas.length === 0 && recordedSkills.length > 0) {
    practiceAreas.push(`Practice explaining a real example of ${recordedSkills[0]} that you can verify.`);
  }

  const contextAvailability = {
    targetRole: Boolean(targetRole),
    resumeAnalysis: evidence.length > 0,
    projects: context.resumeProjects.length > 0,
    experience: context.resumeExperience.length > 0,
    jobFit: context.latestJobRequiredSkills.length > 0 || context.resumeJobFitMissingSkills.length > 0,
    jobDescription: Boolean(context.latestJobDescription),
    careerPlan: context.activeCareerPlanItems.length > 0,
  };
  return {
    targetRole,
    technicalTopics: recordedSkills.slice(0, 8),
    behavioralQuestions: questions.filter((question) => question.category === 'BEHAVIORAL').map((question) => question.question),
    projectTalkingPoints: context.resumeProjects.slice(0, 3).map((project) => (
      `Prepare to explain your contribution and verifiable outcome for: ${project}.`
    )),
    questions: questions.map(({ id, category, question, rationale }) => ({ id, category, question, rationale })),
    contextAvailability,
    contextNotice: interviewContextNotice(context, targetRole),
    readiness: interviewReadiness(context),
    recommendedPracticeAreas: practiceAreas.slice(0, 6),
  };
}

function evaluateInterviewAnswer(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError('A question, category, and answer are required', 400);
  }
  const question = typeof input.question === 'string' ? input.question.trim() : '';
  const answer = typeof input.answer === 'string' ? input.answer.trim() : '';
  const category = typeof input.category === 'string' ? input.category.trim().toUpperCase() : '';
  if (!question || question.length > MAX_INTERVIEW_PROMPT_LENGTH) {
    throw createError(`Question must be between 1 and ${MAX_INTERVIEW_PROMPT_LENGTH} characters`, 400);
  }
  if (!answer || answer.length > MAX_INTERVIEW_ANSWER_LENGTH) {
    throw createError(`Answer must be between 1 and ${MAX_INTERVIEW_ANSWER_LENGTH} characters`, 400);
  }
  if (!INTERVIEW_CATEGORIES.has(category)) throw createError('Interview question category is invalid', 400);

  const questionTerms = uniqueText(question.toLocaleLowerCase().match(/[a-z0-9+#.]+/g) ?? [])
    .filter((term) => term.length > 2 && !INTERVIEW_STOP_WORDS.has(term));
  const answerTerms = new Set(answer.toLocaleLowerCase().match(/[a-z0-9+#.]+/g) ?? []);
  const sharedTerms = questionTerms.filter((term) => answerTerms.has(term));
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const sentenceCount = answer.split(/[.!?]+/).filter((sentence) => sentence.trim()).length;
  const starSignals = {
    situation: /\b(situation|context|when|while|during)\b/i.test(answer),
    task: /\b(task|goal|responsib|needed to|asked to)\b/i.test(answer),
    action: /\b(i|we)\s+(built|created|designed|implemented|led|improved|reduced|tested|resolved|decided|organized)\b/i.test(answer),
    result: /\b(result|outcome|impact|improved|increased|reduced|learned|achieved)\b/i.test(answer),
  };
  const detectedStarElements = Object.entries(starSignals)
    .filter(([, detected]) => detected)
    .map(([element]) => element.toUpperCase());
  const improvements = [];
  if (wordCount < 35) improvements.push('Add a little more detail, such as the context, your specific action, and the outcome you can verify.');
  if (sharedTerms.length === 0) improvements.push('Make the connection to the question clearer by naming the relevant concept or example where accurate.');
  if (category === 'BEHAVIORAL' && detectedStarElements.length < 4) {
    improvements.push(`Consider a STAR structure; detected elements: ${detectedStarElements.length ? detectedStarElements.join(', ') : 'none by keyword'}.`);
  } else if (sentenceCount < 2) {
    improvements.push('Separate the main point from its supporting example to make the answer easier to follow.');
  }
  if (improvements.length === 0) improvements.push('Review the answer for accuracy and ensure every personal claim reflects your actual experience.');

  const strengths = [];
  if (wordCount >= 35 && sentenceCount >= 2) strengths.push('The response includes multiple sentences and enough detail for a structured answer.');
  if (sharedTerms.length > 0) strengths.push(`The answer repeats ${sharedTerms.slice(0, 3).join(', ')}, terms also present in the question.`);
  if (strengths.length === 0) strengths.push('You have a starting point to refine through another practice pass.');

  return {
    topicCoverage: {
      status: sharedTerms.length > 0 ? 'SOME_TERMS_PRESENT' : 'NO_SHARED_TERMS_DETECTED',
      note: 'This is a text-term comparison only; it does not assess semantic relevance or correctness.',
      matchedTerms: sharedTerms.slice(0, 5),
    },
    clarity: {
      status: wordCount >= 35 && sentenceCount >= 2 ? 'DETAILED' : 'BRIEF',
      wordCount,
      sentenceCount,
    },
    structure: {
      suggestedFormat: category === 'BEHAVIORAL' ? 'STAR' : 'POINT_EXAMPLE_OUTCOME',
      detectedStarElements,
    },
    strengths,
    improvements,
    technicalValidation: 'Technical correctness and personal claims are not independently verified. Confirm technical details and keep examples truthful.',
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
      const result = await selectedProvider[method](context, ...args);
      return method === 'prepareForInterview' ? enrichInterviewPreparation(context, result) : result;
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
    evaluateInterviewAnswer: (_user, input) => evaluateInterviewAnswer(input),
  };
}