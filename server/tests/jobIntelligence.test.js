import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { extractAuthentication, generateToken } from '../src/utils/jwt.js';

const testEnvironment = {
  JWT_SECRET: randomBytes(32).toString('hex'),
  JWT_EXPIRATION: '3600000',
};
const OWNER_ID = 'c'.repeat(24);
const OTHER_ID = 'd'.repeat(24);
const JOB_DESCRIPTION = [
  'Role: Backend Developer',
  'Requirements:',
  'Java, Spring Boot, Docker',
  'Preferred:',
  'Kubernetes, AWS',
  'Responsibilities:',
  'Build reliable REST API services for users and teams.',
].join('\n');

function createUserModel() {
  const users = new Map([
    [OWNER_ID, {
      _id: OWNER_ID,
      email: 'job-owner@example.com',
      fullName: 'Job Owner',
      role: 'USER',
      profile: { skills: ['Java'], graduationYear: new Date().getFullYear() - 1 },
    }],
    [OTHER_ID, {
      _id: OTHER_ID,
      email: 'other-job-user@example.com',
      fullName: 'Other Job User',
      role: 'USER',
      profile: { skills: ['Python'], graduationYear: null },
    }],
  ]);
  return {
    async findOne({ email }) {
      return [...users.values()].find((user) => user.email === email) ?? null;
    },
    async findById(id) {
      return users.get(String(id)) ?? null;
    },
  };
}

function createResumeModel() {
  const resumes = new Map([
    [OWNER_ID, { detectedSkills: ['Spring Boot'] }],
    [OTHER_ID, { detectedSkills: ['Python'] }],
  ]);
  return {
    findOne({ user }) {
      return {
        sort() {
          return {
            select: async () => resumes.get(String(user)) ?? null,
          };
        },
      };
    },
  };
}

function createJobModel() {
  const records = [];
  let nextId = 1;
  return {
    records,
    async create(document) {
      const record = {
        _id: nextId.toString(16).padStart(24, '0'),
        createdAt: new Date(`2025-02-${String(nextId).padStart(2, '0')}T00:00:00.000Z`),
        ...document,
      };
      nextId += 1;
      records.push(record);
      return record;
    },
    find({ user }) {
      const selected = records.filter((record) => String(record.user) === String(user));
      return {
        sort(order) {
          return Promise.resolve(selected.sort((left, right) => (
            (order.createdAt < 0 ? -1 : 1) * (left.createdAt.getTime() - right.createdAt.getTime())
          )));
        },
      };
    },
    async findOne({ _id, user }) {
      return records.find((record) => String(record._id) === String(_id)
        && String(record.user) === String(user)) ?? null;
    },
  };
}

function assertSafeError(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.equal(response.body.status, status);
  assert.equal(typeof response.body.message, 'string');
  assert.ok(response.body.timestamp);
  assert.equal('stack' in response.body, false);
}

function assertJobResponseShape(response) {
  assert.deepEqual(Object.keys(response).sort(), [
    'id', 'jobTitle', 'companyName', 'rawJobDescription', 'overallMatchScore',
    'requiredSkillMatchPercent', 'preferredSkillMatchPercent', 'requiredSkills',
    'preferredSkills', 'matchedSkills', 'missingSkills', 'skillGaps',
    'recommendations', 'interviewQuestions', 'createdAt',
  ].sort());
}

describe('Job Intelligence API', () => {
  let app;
  let jobModel;
  let ownerToken;
  let otherToken;

  beforeEach(() => {
    jobModel = createJobModel();
    const authDependencies = {
      userModel: createUserModel(),
      authenticateToken: (token) => extractAuthentication(token, testEnvironment),
    };
    app = createApp({
      authDependencies,
      jobDependencies: { ...authDependencies, jobModel, resumeModel: createResumeModel() },
    });
    ownerToken = generateToken('job-owner@example.com', 'USER', testEnvironment);
    otherToken = generateToken('other-job-user@example.com', 'USER', testEnvironment);
  });

  it('validates job description length and required JSON fields', async () => {
    const response = await request(app)
      .post('/api/job-intelligence/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ jobDescription: 'Too short' });

    assertSafeError(response, 400);
    assert.ok(response.body.errors.jobDescription);
  });

  it('requires authentication for analyze, history, and single-record routes', async () => {
    const analyze = await request(app).post('/api/job-intelligence/analyze').send({ jobDescription: JOB_DESCRIPTION });
    const history = await request(app).get('/api/job-intelligence/history');
    const single = await request(app).get(`/api/job-intelligence/${'1'.repeat(24)}`);

    assertSafeError(analyze, 401);
    assertSafeError(history, 401);
    assertSafeError(single, 401);
  });

  it('ports required/preferred extraction, substring skill matching, scores, and result ordering', async () => {
    const response = await request(app)
      .post('/api/job-intelligence/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        jobTitle: '  Platform Engineer  ',
        companyName: '  Example Systems  ',
        jobDescription: JOB_DESCRIPTION,
        userId: OTHER_ID,
      });

    assert.equal(response.status, 200);
    assertJobResponseShape(response.body);
    assert.equal(response.body.jobTitle, 'Platform Engineer');
    assert.equal(response.body.companyName, 'Example Systems');
    assert.equal(response.body.rawJobDescription, JOB_DESCRIPTION);
    assert.deepEqual(response.body.requiredSkills, ['Java', 'Spring', 'Spring Boot', 'Docker', 'REST API']);
    assert.deepEqual(response.body.preferredSkills, ['AWS', 'Kubernetes']);
    assert.deepEqual(response.body.matchedSkills, ['Java', 'Spring', 'Spring Boot']);
    assert.deepEqual(response.body.missingSkills, ['Docker', 'REST API', 'AWS', 'Kubernetes']);
    assert.equal(response.body.requiredSkillMatchPercent, 60);
    assert.equal(response.body.preferredSkillMatchPercent, 0);
    assert.equal(response.body.overallMatchScore, 51);
    assert.deepEqual(response.body.skillGaps.map((gap) => gap.priority), ['HIGH', 'HIGH', 'MEDIUM', 'MEDIUM']);
    assert.equal(response.body.recommendations.length, 3);
    assert.equal(response.body.interviewQuestions.length, 5);
    assert.equal(jobModel.records[0].user, OWNER_ID);
  });

  it('uses Java title and company fallbacks when omitted', async () => {
    const response = await request(app)
      .post('/api/job-intelligence/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        jobDescription: 'Backend Developer\nRequirements: Python SQL Git. Join Acme Labs is a growing company. '.padEnd(100, 'x'),
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.jobTitle, 'Backend Developer');
    assert.equal(response.body.companyName, 'Acme Labs is a growing company');
  });

  it('persists and returns only the authenticated user history newest first', async () => {
    const first = await request(app)
      .post('/api/job-intelligence/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ jobDescription: JOB_DESCRIPTION });
    const second = await request(app)
      .post('/api/job-intelligence/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ jobDescription: `${JOB_DESCRIPTION}\nExtra Role` });
    await request(app)
      .post('/api/job-intelligence/analyze')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ jobDescription: JOB_DESCRIPTION });

    const response = await request(app)
      .get(`/api/job-intelligence/history?userId=${OTHER_ID}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.map((analysis) => analysis.id), [second.body.id, first.body.id]);
    response.body.forEach(assertJobResponseShape);
  });

  it('returns only a user-owned record and hides another user record', async () => {
    const own = await request(app)
      .post('/api/job-intelligence/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ jobDescription: JOB_DESCRIPTION });
    const foreign = await request(app)
      .post('/api/job-intelligence/analyze')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ jobDescription: JOB_DESCRIPTION });

    const ownResponse = await request(app)
      .get(`/api/job-intelligence/${own.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    const foreignResponse = await request(app)
      .get(`/api/job-intelligence/${foreign.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(ownResponse.status, 200);
    assertJobResponseShape(ownResponse.body);
    assertSafeError(foreignResponse, 404);
  });

  it('rejects malformed Mongo IDs without leaking database details', async () => {
    const response = await request(app)
      .get('/api/job-intelligence/not-an-object-id')
      .set('Authorization', `Bearer ${ownerToken}`);
    assertSafeError(response, 400);
    assert.equal(response.body.message, 'Invalid job analysis ID.');
  });
});