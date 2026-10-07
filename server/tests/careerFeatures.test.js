import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { DeterministicCareerAiProvider } from '../src/services/deterministicCareerAiProvider.js';
import { LlmCareerAiProvider, resolveLlmConfiguration } from '../src/services/llmCareerAiProvider.js';
import { extractAuthentication, generateToken } from '../src/utils/jwt.js';

const testEnvironment = {
  JWT_SECRET: randomBytes(32).toString('hex'),
  JWT_EXPIRATION: '3600000',
};
const OWNER_ID = 'e'.repeat(24);
const OTHER_ID = 'f'.repeat(24);

function createQuery(value) {
  return {
    sort() { return this; },
    select() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}

function addItemLookup(items) {
  items.id = (id) => items.find((item) => String(item._id) === String(id));
  return items;
}

function createCareerModels() {
  const users = new Map([
    [OWNER_ID, {
      _id: OWNER_ID,
      email: 'career-owner@example.com',
      fullName: 'Career Owner',
      role: 'USER',
      profile: {
        careerGoal: 'Backend Engineer',
        skills: ['Java'],
        education: 'Computer Science',
        college: 'Example College',
        graduationYear: 2027,
        bio: 'Builds reliable services',
      },
    }],
    [OTHER_ID, {
      _id: OTHER_ID,
      email: 'career-other@example.com',
      fullName: 'Other Career User',
      role: 'USER',
      profile: { careerGoal: 'Designer', skills: ['Design'], graduationYear: null },
    }],
  ]);
  const resumes = [
    {
      _id: '1'.repeat(24),
      user: OWNER_ID,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      detectedSkills: ['Java', 'Spring Boot'],
      detectedEducation: ['Computer Science'],
      detectedExperience: ['Built APIs'],
      detectedProjects: ['Inventory tracking API'],
      missingSections: ['Certifications'],
      improvementSuggestions: ['Add measurable impact'],
      targetRole: 'Backend Engineer',
      matchScore: 78,
      jobMarketInsights: {
        status: 'available',
        totalMatches: 12,
        suitableRoles: [{ title: 'Backend Engineer', jobCount: 8 }],
        commonSkills: [{ skill: 'Docker', jobCount: 6 }],
        skillGaps: [{ skill: 'Kubernetes', jobCount: 4 }],
      },
      jobSpecificAnalysis: {
        jobFitScore: 78,
        missingSkills: ['Docker'],
      },
      rawText: 'private resume data',
    },
  ];
  const jobs = [
    {
      _id: '2'.repeat(24),
      user: OWNER_ID,
      createdAt: new Date('2025-02-01T00:00:00.000Z'),
      jobTitle: 'Backend Engineer',
      companyName: 'Example Company',
      rawJobDescription: 'Backend Engineer role requiring Java and Docker to build REST services.',
      overallMatchScore: 78,
      requiredSkills: ['Java', 'Docker'],
      preferredSkills: ['Kubernetes'],
      matchedSkills: ['Java'],
      missingSkills: ['Docker', 'Kubernetes'],
      skillGaps: [
        { skill: 'Docker', priority: 'HIGH', explanation: 'Required gap' },
        { skill: 'Kubernetes', priority: 'MEDIUM', explanation: 'Preferred gap' },
      ],
    },
  ];
  const conversations = [];
  const messages = [];
  const plans = [];
  let conversationNumber = 1;
  let messageNumber = 1;
  let planNumber = 1;
  let itemNumber = 1;

  const userModel = {
    async findOne({ email }) { return [...users.values()].find((user) => user.email === email) ?? null; },
    async findById(id) { return users.get(String(id)) ?? null; },
    records: users,
  };
  const resumeModel = {
    records: resumes,
    findOne({ user }) {
      return createQuery(resumes
        .filter((record) => String(record.user) === String(user))
        .sort((left, right) => right.createdAt - left.createdAt)[0] ?? null);
    },
  };
  const jobModel = {
    records: jobs,
    findOne({ user }) {
      return createQuery(jobs
        .filter((record) => String(record.user) === String(user))
        .sort((left, right) => right.createdAt - left.createdAt)[0] ?? null);
    },
  };
  const conversationModel = {
    records: conversations,
    async create(document) {
      const now = new Date(`2025-03-${String(conversationNumber).padStart(2, '0')}T00:00:00.000Z`);
      const record = {
        _id: conversationNumber.toString(16).padStart(24, '0'),
        createdAt: now,
        updatedAt: now,
        ...document,
        async save() { return record; },
      };
      conversationNumber += 1;
      conversations.push(record);
      return record;
    },
    find({ user }) {
      return {
        sort() {
          return Promise.resolve(conversations
            .filter((record) => String(record.user) === String(user))
            .sort((left, right) => right.updatedAt - left.updatedAt));
        },
      };
    },
    findOne(criteria) {
      return Promise.resolve(conversations.find((record) => (
        String(record._id) === String(criteria._id)
        && String(record.user) === String(criteria.user)
      )) ?? null);
    },
  };
  const messageModel = {
    records: messages,
    async create(document) {
      const record = {
        _id: messageNumber.toString(16).padStart(24, '0'),
        createdAt: new Date(`2025-04-${String(messageNumber).padStart(2, '0')}T00:00:00.000Z`),
        ...document,
      };
      messageNumber += 1;
      messages.push(record);
      return record;
    },
    find({ conversation }) {
      return {
        sort() {
          return Promise.resolve(messages
            .filter((message) => String(message.conversation) === String(conversation))
            .sort((left, right) => left.createdAt - right.createdAt));
        },
      };
    },
  };
  const planModel = {
    records: plans,
    async create(document) {
      const now = new Date(`2025-05-${String(planNumber).padStart(2, '0')}T00:00:00.000Z`);
      const items = addItemLookup((document.items ?? []).map((item) => ({
        _id: (itemNumber++).toString(16).padStart(24, '0'),
        ...item,
      })));
      const plan = {
        _id: planNumber.toString(16).padStart(24, '0'),
        createdAt: now,
        updatedAt: now,
        ...document,
        items,
        async save() { return plan; },
      };
      planNumber += 1;
      plans.push(plan);
      return plan;
    },
    findOne(criteria) {
      const result = plans
        .filter((plan) => String(plan.user) === String(criteria.user)
          && (criteria.status == null || plan.status === criteria.status)
          && (criteria._id == null || String(plan._id) === String(criteria._id)))
        .sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
      return createQuery(result);
    },
  };

  return { userModel, resumeModel, jobModel, conversationModel, messageModel, planModel };
}

function safeError(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.equal(response.body.status, status);
  assert.equal(typeof response.body.message, 'string');
  assert.ok(response.body.timestamp);
  assert.equal('stack' in response.body, false);
}

describe('Career Assistant and Plan APIs', () => {
  let app;
  let models;
  let ownerToken;
  let otherToken;
  let provider;

  beforeEach(() => {
    models = createCareerModels();
    provider = new DeterministicCareerAiProvider();
    const authDependencies = {
      userModel: models.userModel,
      authenticateToken: (token) => extractAuthentication(token, testEnvironment),
    };
    const careerDependencies = { ...authDependencies, ...models, aiProvider: provider };
    app = createApp({ authDependencies, careerDependencies });
    ownerToken = generateToken('career-owner@example.com', 'USER', testEnvironment);
    otherToken = generateToken('career-other@example.com', 'USER', testEnvironment);
  });

  it('requires authentication for all conversation, AI-tool, and plan endpoints', async () => {
    const requests = [
      request(app).post('/api/career-assistant/conversations'),
      request(app).get('/api/career-assistant/conversations'),
      request(app).get(`/api/career-assistant/conversations/${'1'.repeat(24)}/messages`),
      request(app).post(`/api/career-assistant/conversations/${'1'.repeat(24)}/messages`).send({ question: 'question' }),
      request(app).post('/api/career-assistant/action-plan'),
      request(app).post('/api/career-assistant/resume-improvement'),
      request(app).post('/api/career-assistant/roadmap'),
      request(app).post('/api/career-assistant/projects'),
      request(app).post('/api/career-assistant/interview-preparation'),
      request(app).post('/api/career-assistant/interview-preparation/feedback').send({
        question: 'Explain Java.',
        category: 'TECHNICAL',
        answer: 'Java is a programming language.',
      }),
      request(app).post('/api/career-plans'),
      request(app).get('/api/career-plans/current'),
      request(app).get(`/api/career-plans/${'1'.repeat(24)}`),
      request(app).patch(`/api/career-plans/${'1'.repeat(24)}/items/${'2'.repeat(24)}`).send({ completed: true }),
    ];
    const responses = await Promise.all(requests);
    responses.forEach((response) => safeError(response, 401));
  });

  it('creates and lists only owned conversations in updated-time order', async () => {
    const first = await request(app)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${ownerToken}`);
    const second = await request(app)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${ownerToken}`);
    await request(app)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${otherToken}`);
    const response = await request(app)
      .get('/api/career-assistant/conversations?userId=${OTHER_ID}')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(first.status, 201);
    assert.equal(first.body.title, 'Career Assistant');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.map((conversation) => conversation.id), [second.body.id, first.body.id]);
    assert.equal(response.body.some((conversation) => conversation.email), false);
  });

  it('persists both message roles, returns the assistant message, and updates conversation title', async () => {
    const conversation = await request(app)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${ownerToken}`);
    const response = await request(app)
      .post(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: '  What is my career goal?  ' });

    assert.equal(response.status, 200);
    assert.equal(response.body.role, 'ASSISTANT');
    assert.equal(response.body.provider, 'deterministic');
    assert.match(response.body.content, /Backend Engineer/);
    assert.deepEqual(models.messageModel.records.map((message) => message.role), ['USER', 'ASSISTANT']);
    assert.equal(models.messageModel.records[0].content, 'What is my career goal?');
    assert.equal(models.conversationModel.records[0].title, 'What is my career goal?');
    assert.equal('conversation' in response.body, false);
    assert.deepEqual(response.body.followUpSuggestions, ['Which skills support this goal?', 'What should I do next?']);
    assert.deepEqual(models.messageModel.records[1].followUpSuggestions, response.body.followUpSuggestions);
  });

  it('answers skill-gap, resume, and market questions from the owner-scoped saved analysis', async () => {
    const conversation = await request(app)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${ownerToken}`);
    const answer = async (question) => request(app)
      .post(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question });

    const skills = await answer('What skills am I missing for backend development?');
    const resume = await answer('How can I improve my resume?');
    const market = await answer('What job-market trends are relevant to me?');

    assert.match(skills.body.content, /Docker/);
    assert.match(skills.body.content, /Kubernetes/);
    assert.match(resume.body.content, /Certifications/);
    assert.match(resume.body.content, /Add measurable impact/);
    assert.match(market.body.content, /12 postings/);
    assert.match(market.body.content, /Backend Engineer \(8\)/);
    assert.match(market.body.content, /not evidence of how demand has changed/);
    assert.equal(JSON.stringify([skills.body, resume.body, market.body]).includes('private resume data'), false);
  });

  it('clearly reports unavailable user context without exposing another owner’s data', async () => {
    const conversation = await request(app)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${otherToken}`);
    const response = await request(app)
      .post(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ question: 'How can I improve my resume?' });

    assert.equal(response.status, 200);
    assert.match(response.body.content, /No saved resume-analysis findings/);
    assert.match(response.body.content, /job-market snapshot/);
    assert.doesNotMatch(response.body.content, /Career Owner|Docker|private resume data/);
  });

  it('uses the owner’s active career plan to answer next-step questions', async () => {
    const plan = await request(app)
      .post('/api/career-plans')
      .set('Authorization', `Bearer ${ownerToken}`);
    const conversation = await request(app)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${ownerToken}`);
    const response = await request(app)
      .post(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'What is next in my career plan?' });

    assert.equal(plan.status, 200);
    assert.equal(response.status, 200);
    assert.match(response.body.content, /active career plan/);
    assert.match(response.body.content, new RegExp(plan.body.items[0].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  it('returns messages in creation order and rejects cross-user conversation reads', async () => {
    const conversation = await request(app)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${ownerToken}`);
    await request(app)
      .post(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'What should I learn?' });
    await request(app)
      .post(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'How can I practice those skills?' });

    const messages = await request(app)
      .get(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`);
    const foreign = await request(app)
      .get(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${otherToken}`);

    assert.equal(messages.status, 200);
    assert.deepEqual(messages.body.map((message) => message.role), ['USER', 'ASSISTANT', 'USER', 'ASSISTANT']);
    assert.deepEqual(messages.body.filter((message) => message.role === 'USER').map((message) => message.content), [
      'What should I learn?',
      'How can I practice those skills?',
    ]);
    safeError(foreign, 404);
  });

  it('rejects blank and overlong chat questions', async () => {
    const conversation = await request(app)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${ownerToken}`);
    const blank = await request(app)
      .post(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: '  ' });
    const long = await request(app)
      .post(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'q'.repeat(2001) });

    safeError(blank, 400);
    safeError(long, 400);
    assert.equal(models.messageModel.records.length, 0);
  });

  it('keeps provider errors safe and does not persist partial chat turns', async () => {
    const failingProvider = {
      answerCareerQuestion: async () => {
        throw new Error('safe provider failure', { cause: 'AI_PROVIDER_FAILED' });
      },
      providerName: () => 'llm',
    };
    const dependencies = {
      ...models,
      aiProvider: failingProvider,
      authenticateToken: (token) => extractAuthentication(token, testEnvironment),
      userModel: models.userModel,
    };
    const failingApp = createApp({ authDependencies: dependencies, careerDependencies: dependencies });
    const conversation = await request(failingApp)
      .post('/api/career-assistant/conversations')
      .set('Authorization', `Bearer ${ownerToken}`);
    const response = await request(failingApp)
      .post(`/api/career-assistant/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'What should I learn?' });

    safeError(response, 503);
    assert.equal(models.messageModel.records.length, 0);
  });

  it('provides all deterministic career guidance tools from authenticated context', async () => {
    const actionPlan = await request(app).post('/api/career-assistant/action-plan').set('Authorization', `Bearer ${ownerToken}`);
    const improvement = await request(app).post('/api/career-assistant/resume-improvement').set('Authorization', `Bearer ${ownerToken}`);
    const roadmap = await request(app).post('/api/career-assistant/roadmap').set('Authorization', `Bearer ${ownerToken}`);
    const projects = await request(app).post('/api/career-assistant/projects').set('Authorization', `Bearer ${ownerToken}`);
    const interview = await request(app).post('/api/career-assistant/interview-preparation').set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(actionPlan.status, 200);
    assert.ok(actionPlan.body.actions.length);
    assert.deepEqual(Object.keys(improvement.body).sort(), ['missingContent', 'strongerWordingSuggestions', 'weakAreas']);
    assert.deepEqual(roadmap.body.stages.map((stage) => stage.name), ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']);
    assert.ok(projects.body.recommendations.length);
    assert.ok(interview.body.technicalTopics.length);
    assert.ok(interview.body.behavioralQuestions.length);
    assert.ok(interview.body.projectTalkingPoints.length);
    assert.equal(interview.body.targetRole, 'Backend Engineer');
    assert.equal(interview.body.contextAvailability.jobDescription, true);
    assert.ok(interview.body.questions.some((item) => item.category === 'TECHNICAL' && /Docker/.test(item.question)));
    assert.ok(interview.body.questions.some((item) => item.category === 'PROJECT_BASED' && /Inventory tracking API/.test(item.question)));
    assert.ok(interview.body.questions.some((item) => item.category === 'ROLE_SPECIFIC'));
    assert.equal(interview.body.readiness.status, 'NEEDS_PRACTICE');
    assert.ok(interview.body.recommendedPracticeAreas.some((item) => /Docker|Kubernetes/.test(item)));
  });

  it('limits interview questions and practice recommendations to the authenticated user data', async () => {
    models.resumeModel.records.push({
      _id: '3'.repeat(24),
      user: OTHER_ID,
      createdAt: new Date('2025-03-01T00:00:00.000Z'),
      detectedSkills: ['Ruby'],
      detectedProjects: ['Foreign private project'],
      detectedExperience: ['Foreign private work history'],
    });
    models.jobModel.records.push({
      _id: '4'.repeat(24),
      user: OTHER_ID,
      createdAt: new Date('2025-03-01T00:00:00.000Z'),
      jobTitle: 'Designer',
      rawJobDescription: 'Foreign private job description.',
      requiredSkills: ['Design'],
    });
    models.planModel.records.push({
      user: OTHER_ID,
      status: 'ACTIVE',
      updatedAt: new Date('2025-03-01T00:00:00.000Z'),
      items: [{ itemType: 'INTERVIEW', title: 'Foreign private interview plan', completed: false }],
    });

    const response = await request(app)
      .post('/api/career-assistant/interview-preparation')
      .set('Authorization', `Bearer ${ownerToken}`);
    const body = JSON.stringify(response.body);

    assert.equal(response.status, 200);
    assert.doesNotMatch(body, /Ruby|Foreign private|Designer|Foreign private job/);
    assert.match(body, /Inventory tracking API/);
    assert.match(body, /Backend Engineer/);
  });

  it('provides generic-only interview questions and an explicit context notice when saved data is missing', async () => {
    models.userModel.records.get(OWNER_ID).profile.careerGoal = null;
    models.userModel.records.get(OWNER_ID).profile.skills = [];
    models.resumeModel.records.length = 0;
    models.jobModel.records.length = 0;

    const response = await request(app)
      .post('/api/career-assistant/interview-preparation')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.targetRole, null);
    assert.equal(response.body.technicalTopics.length, 0);
    assert.equal(response.body.projectTalkingPoints.length, 0);
    assert.ok(response.body.contextNotice);
    assert.deepEqual(new Set(response.body.questions.map((item) => item.category)), new Set(['BEHAVIORAL', 'SITUATIONAL', 'HR']));
    assert.equal(response.body.readiness.status, 'NOT_ENOUGH_DATA');
  });

  it('connects interview practice recommendations to the owner’s active Career Plan', async () => {
    models.planModel.records.push({
      user: OWNER_ID,
      status: 'ACTIVE',
      updatedAt: new Date('2025-03-02T00:00:00.000Z'),
      careerGoal: 'Backend Engineer',
      items: [
        { itemType: 'INTERVIEW', title: 'Practice Java interview questions', completed: false },
        { itemType: 'PROJECT', title: 'Build a Spring Boot REST API', completed: false },
      ],
    });
    const response = await request(app)
      .post('/api/career-assistant/interview-preparation')
      .set('Authorization', `Bearer ${ownerToken}`);
    const recommendations = response.body.recommendedPracticeAreas.join(' ');

    assert.equal(response.status, 200);
    assert.equal(response.body.contextAvailability.careerPlan, true);
    assert.match(recommendations, /Practice Java interview questions/);
    assert.match(recommendations, /planned project.*not evidence/i);
  });

  it('returns transparent answer-structure feedback and rejects invalid feedback requests', async () => {
    const feedback = await request(app)
      .post('/api/career-assistant/interview-preparation/feedback')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        question: 'Explain how Spring Boot dependency injection supports backend design.',
        category: 'TECHNICAL',
        answer: 'Spring Boot dependency injection lets an application provide its required objects instead of constructing every dependency directly. I would explain the container, describe how the dependencies are wired, mention a testing benefit, and give a verified example from my own work.',
      });
    const invalid = await request(app)
      .post('/api/career-assistant/interview-preparation/feedback')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'Explain this.', category: 'UNKNOWN', answer: 'My answer.' });
    const blank = await request(app)
      .post('/api/career-assistant/interview-preparation/feedback')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ question: 'Explain this.', category: 'TECHNICAL', answer: ' ' });
    const invalidBody = await request(app)
      .post('/api/career-assistant/interview-preparation/feedback')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(null);

    assert.equal(feedback.status, 200);
    assert.ok(feedback.body.strengths.length > 0);
    assert.equal(feedback.body.clarity.status, 'DETAILED');
    assert.match(feedback.body.technicalValidation, /not independently verified/i);
    safeError(invalid, 400);
    safeError(blank, 400);
    safeError(invalidBody, 400);
  });

  it('surfaces interview provider failures safely through the existing Career Assistant route', async () => {
    const failingProvider = {
      prepareForInterview: async () => {
        throw new Error('safe provider failure', { cause: 'AI_PROVIDER_FAILED' });
      },
    };
    const dependencies = {
      ...models,
      aiProvider: failingProvider,
      authenticateToken: (token) => extractAuthentication(token, testEnvironment),
      userModel: models.userModel,
    };
    const failingApp = createApp({ authDependencies: dependencies, careerDependencies: dependencies });
    const response = await request(failingApp)
      .post('/api/career-assistant/interview-preparation')
      .set('Authorization', `Bearer ${ownerToken}`);

    safeError(response, 503);
    assert.doesNotMatch(JSON.stringify(response.body), /AI_PROVIDER_FAILED|api.?key/i);
  });

  it('generates career plans with embedded ordered items and latest source references', async () => {
    const response = await request(app)
      .post('/api/career-plans')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'ACTIVE');
    assert.equal(response.body.sourceResumeAnalysisId, '1'.repeat(24));
    assert.equal(response.body.sourceJobAnalysisId, '2'.repeat(24));
    assert.equal(response.body.careerGoal, 'Backend Engineer');
    assert.deepEqual(response.body.items.map((item) => item.sortOrder), [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(response.body.items.map((item) => item.category), [
      'SHORT_TERM', 'SHORT_TERM', 'MEDIUM_TERM', 'MEDIUM_TERM', 'MEDIUM_TERM',
      'LONG_TERM', 'LONG_TERM', 'LONG_TERM',
    ]);
    assert.deepEqual(response.body.items.map((item) => item.priority), [
      'HIGH', 'HIGH', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'LOW', 'LOW', 'LOW',
    ]);
    assert.ok(response.body.items.every((item) => item.completed === false));
    assert.ok(response.body.items.every((item) => item.status === 'NOT_STARTED'));
    assert.equal(response.body.progress.totalItems, response.body.items.length);
    assert.equal(response.body.progress.completedItems, 0);
    assert.equal(response.body.progress.remainingItems, response.body.items.length);
    assert.equal(response.body.progress.completionPercent, 0);
    assert.equal(response.body.progress.currentStage, 'SHORT_TERM');
    assert.match(response.body.items.find((item) => item.skills.includes('Docker')).description, /required skill gap/);
    assert.match(response.body.items.find((item) => item.skills.includes('Kubernetes')).description, /saved job-market snapshot/);
    assert.equal('user' in response.body, false);
  });

  it('uses the resume target role when the profile career goal is missing', async () => {
    models.userModel.records.get(OWNER_ID).profile.careerGoal = null;
    const response = await request(app)
      .post('/api/career-plans')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.careerGoal, 'Backend Engineer');
    assert.ok(response.body.items.length > 0);
  });

  it('requires a target and real career evidence instead of generating a generic plan', async () => {
    models.userModel.records.get(OWNER_ID).profile.careerGoal = null;
    models.resumeModel.records.length = 0;
    models.jobModel.records.length = 0;

    const response = await request(app)
      .post('/api/career-plans')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 400);
    assert.match(response.body.message, /Not enough information yet/);
    assert.equal(models.planModel.records.length, 0);
  });

  it('archives the previous active plan when generating a replacement', async () => {
    const first = await request(app).post('/api/career-plans').set('Authorization', `Bearer ${ownerToken}`);
    const second = await request(app).post('/api/career-plans').set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(models.planModel.records[0].status, 'ARCHIVED');
    assert.equal(models.planModel.records[1].status, 'ACTIVE');
  });

  it('returns current/by-id plans and updates only the completed flag', async () => {
    const generated = await request(app).post('/api/career-plans').set('Authorization', `Bearer ${ownerToken}`);
    const current = await request(app).get('/api/career-plans/current').set('Authorization', `Bearer ${ownerToken}`);
    const byId = await request(app).get(`/api/career-plans/${generated.body.id}`).set('Authorization', `Bearer ${ownerToken}`);
    const item = generated.body.items[0];
    const updated = await request(app)
      .patch(`/api/career-plans/${generated.body.id}/items/${item.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ completed: true, title: 'forged title', userId: OTHER_ID });

    assert.equal(current.status, 200);
    assert.equal(byId.status, 200);
    assert.equal(updated.status, 200);
    assert.equal(updated.body.items[0].completed, true);
    assert.equal(updated.body.items[0].status, 'COMPLETED');
    assert.equal(updated.body.progress.completedItems, 1);
    assert.equal(updated.body.progress.completionPercent, Math.round(100 / generated.body.items.length));
    assert.equal(updated.body.items[0].title, item.title);

    const inProgress = await request(app)
      .patch(`/api/career-plans/${generated.body.id}/items/${generated.body.items[1].id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'IN_PROGRESS' });
    assert.equal(inProgress.status, 200);
    assert.equal(inProgress.body.items[1].completed, false);
    assert.equal(inProgress.body.items[1].status, 'IN_PROGRESS');
    assert.equal(inProgress.body.progress.inProgressItems, 1);
  });

  it('prevents cross-user plan access and rejects malformed update payloads', async () => {
    const plan = await request(app).post('/api/career-plans').set('Authorization', `Bearer ${ownerToken}`);
    const foreign = await request(app)
      .get(`/api/career-plans/${plan.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    const invalid = await request(app)
      .patch(`/api/career-plans/${plan.body.id}/items/${plan.body.items[0].id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ completed: 'true' });
    const invalidItem = await request(app)
      .patch(`/api/career-plans/${plan.body.id}/items/${'a'.repeat(24)}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'COMPLETED' });
    const foreignUpdate = await request(app)
      .patch(`/api/career-plans/${plan.body.id}/items/${plan.body.items[0].id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'COMPLETED' });

    safeError(foreign, 404);
    safeError(invalid, 400);
    safeError(invalidItem, 404);
    safeError(foreignUpdate, 404);
  });
});

describe('AI provider selection and OpenAI-compatible mapping', () => {
  const llmEnvironment = {
    AI_PROVIDER: 'llm',
    JWT_SECRET: testEnvironment.JWT_SECRET,
    LLM_API_KEY: randomBytes(24).toString('hex'),
    LLM_BASE_URL: 'https://llm.example.test/v1',
    LLM_MODEL: 'test-model',
    LLM_TIMEOUT: '2s',
  };

  it('keeps deterministic mode as the default and validates LLM config without revealing keys', () => {
    const emptyKey = Buffer.alloc(0).toString('utf8');
    assert.equal(new DeterministicCareerAiProvider().providerName(), 'deterministic');
    assert.equal(resolveLlmConfiguration(llmEnvironment).timeout, 2000);
    assert.throws(() => resolveLlmConfiguration({ ...llmEnvironment, LLM_API_KEY: emptyKey }), /LLM_API_KEY/);
    assert.throws(() => resolveLlmConfiguration({ ...llmEnvironment, LLM_BASE_URL: 'invalid' }), /LLM_BASE_URL/);
  });

  it('maps mocked chat-completion responses without making external requests', async () => {
    const requests = [];
    const fetchImpl = async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({
        choices: [{ message: { content: '{"answer":"Focus on verified skills.","followUpSuggestions":["What next?"]}' } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    const provider = new LlmCareerAiProvider({ env: llmEnvironment, fetchImpl });
    const result = await provider.answerCareerQuestion({
      careerGoal: 'Backend Engineer',
      skills: ['Java'],
      education: null,
      college: null,
      graduationYear: null,
      bio: null,
      resumeDetectedSkills: [],
      resumeEducation: [],
      resumeExperience: [],
      resumeProjects: [],
      resumeMissingSections: [],
      resumeSuggestions: [],
      resumeTargetRole: 'Backend Engineer',
      resumeJobFitScore: 78,
      resumeJobFitMissingSkills: ['Docker'],
      latestJobTitle: null,
      latestJobCompany: null,
      latestJobOverallScore: null,
      latestJobRequiredSkills: [],
      latestJobPreferredSkills: [],
      latestJobMatchedSkills: [],
      latestJobMissingSkills: [],
      latestJobSkillGaps: [],
      jobMarketStatus: 'available',
      jobMarketTotalMatches: 12,
      jobMarketSuitableRoles: [{ title: 'Backend Engineer', jobCount: 8 }],
      jobMarketCommonSkills: [{ skill: 'Docker', jobCount: 6 }],
      jobMarketSkillGaps: [{ skill: 'Kubernetes', jobCount: 4 }],
      activeCareerPlanGoal: 'Backend Engineer',
      activeCareerPlanItems: [{ title: 'Build an API', completed: false }],
    }, 'What should I learn?', [
      { role: 'user', content: 'How can I improve my resume?' },
      { role: 'assistant', content: 'Your saved analysis recommends measurable impact.' },
    ]);

    assert.deepEqual(result, { answer: 'Focus on verified skills.', followUpSuggestions: ['What next?'] });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://llm.example.test/v1/chat/completions');
    assert.equal(JSON.parse(requests[0].options.body).model, 'test-model');
    assert.match(JSON.parse(requests[0].options.body).messages[1].content, /Backend Engineer/);
    assert.match(JSON.parse(requests[0].options.body).messages[1].content, /ConversationHistory/);
    assert.match(JSON.parse(requests[0].options.body).messages[1].content, /jobMarketTotalMatches/);
    assert.doesNotMatch(JSON.stringify(JSON.parse(requests[0].options.body)), new RegExp(llmEnvironment.LLM_API_KEY));
  });

  it('maps every optional LLM tool contract using only a mocked fetch implementation', async () => {
    const results = [
      { actions: ['Practice Docker'] },
      { weakAreas: ['Metrics'], missingContent: ['Add truthful metrics'], strongerWordingSuggestions: ['Quantify outcomes'] },
      { stages: [{ name: 'SHORT_TERM', objective: 'Learn a skill.', actions: ['Practice Docker'], skills: ['Docker'] }] },
      { recommendations: [{ title: 'Docker demo', description: 'Build a demo.', skills: ['Docker'], rationale: 'Shows applied skill.' }] },
      {
        technicalTopics: ['Docker'],
        behavioralQuestions: ['Describe a challenge.'],
        projectTalkingPoints: ['Explain a project.'],
        questions: [
          { category: 'TECHNICAL', question: 'Explain Docker concepts.', rationale: 'Use saved context.' },
          { category: 'PROJECT_BASED', question: 'Walk through the saved demo project.', rationale: 'Use saved context.' },
        ],
      },
    ];
    let index = 0;
    let requestCount = 0;
    const fetchImpl = async () => {
      requestCount += 1;
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(results[index++]) } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    const provider = new LlmCareerAiProvider({ env: llmEnvironment, fetchImpl });
    const context = {
      careerGoal: 'Backend Engineer',
      skills: ['Java'],
      education: null,
      college: null,
      graduationYear: null,
      bio: null,
      resumeDetectedSkills: [],
      resumeEducation: [],
      resumeExperience: [],
      resumeProjects: [],
      resumeMissingSections: [],
      resumeSuggestions: [],
      latestJobTitle: 'Backend Engineer',
      latestJobCompany: 'Example Company',
      latestJobOverallScore: 75,
      latestJobRequiredSkills: ['Docker'],
      latestJobPreferredSkills: [],
      latestJobMatchedSkills: [],
      latestJobMissingSkills: ['Docker'],
      latestJobSkillGaps: [],
    };

    assert.deepEqual(await provider.generateActionPlan(context), results[0]);
    assert.deepEqual(await provider.improveResume(context), results[1]);
    assert.deepEqual(await provider.generateCareerRoadmap(context), results[2]);
    assert.deepEqual(await provider.recommendProjects(context), results[3]);
    assert.deepEqual(await provider.prepareForInterview(context), results[4]);
    assert.equal(requestCount, 5);
  });

  it('normalizes LLM HTTP failures without returning upstream bodies or credentials', async () => {
    const provider = new LlmCareerAiProvider({
      env: llmEnvironment,
      fetchImpl: async () => new Response('upstream secret body', { status: 429 }),
    });
    await assert.rejects(provider.generateActionPlan({}), /rate limited/);
  });
});