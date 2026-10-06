import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  createJobPosting,
  normalizeSkill,
  parseSkillTags,
} from '../src/services/jobDatasetService.js';
import { JOB_DATASET_ID } from '../src/services/jobDatasetService.js';
import { extractAuthentication, generateToken } from '../src/utils/jwt.js';

const testEnvironment = {
  JWT_SECRET: randomBytes(32).toString('hex'),
  JWT_EXPIRATION: '3600000',
};
const OWNER_ID = 'e'.repeat(24);
const OTHER_ID = 'f'.repeat(24);
const RESUME_ID = '1'.repeat(24);

function createUserModel() {
  const users = [
    {
      _id: OWNER_ID,
      email: 'recommend-owner@example.com',
      profile: { location: 'Pune' },
    },
    {
      _id: OTHER_ID,
      email: 'recommend-other@example.com',
      profile: { location: null },
    },
  ];
  return {
    async findOne({ email }) {
      return users.find((user) => user.email === email) ?? null;
    },
    async findById(id) {
      return users.find((user) => user._id === String(id)) ?? null;
    },
  };
}

function createResumeModel({ detectedSkills = ['JS', 'React.js', 'Java'] } = {}) {
  return {
    findOne({ _id, user }) {
      const record = String(_id) === RESUME_ID && String(user) === OWNER_ID
        ? { detectedSkills, detectedExperience: ['3 years of experience'] }
        : null;
      return {
        select: async () => record,
      };
    },
  };
}

function createJobPostingModel({ datasetAvailable = true } = {}) {
  const jobs = [
    {
      sourceDataset: JOB_DATASET_ID,
      jobId: 'recommended-1',
      title: 'Frontend Engineer',
      companyName: 'Example Labs',
      location: 'Pune',
      experience: '2-5 Yrs',
      salary: '12-18 Lacs PA',
      currency: 'INR',
      minimumExperience: 2,
      maximumExperience: 5,
      minimumSalary: 1200000,
      maximumSalary: 1800000,
      normalizedSkills: ['javascript', 'react', 'node.js'],
      skillNames: ['JavaScript', 'React', 'Node.js'],
      jobDescription: 'Build a web application.',
      aggregateRating: 4.2,
      reviewsCount: 27,
    },
    {
      sourceDataset: JOB_DATASET_ID,
      jobId: 'recommended-2',
      title: 'Backend Engineer',
      companyName: 'Another Company',
      location: 'Bengaluru',
      experience: '5-8 Yrs',
      salary: null,
      currency: null,
      minimumExperience: 5,
      maximumExperience: 8,
      minimumSalary: null,
      maximumSalary: null,
      normalizedSkills: ['java', 'sql'],
      skillNames: ['Java', 'SQL'],
      jobDescription: null,
      aggregateRating: null,
      reviewsCount: null,
    },
    {
      sourceDataset: JOB_DATASET_ID,
      jobId: 'not-a-match',
      title: 'Data Scientist',
      normalizedSkills: ['python'],
      skillNames: ['Python'],
    },
  ];

  return {
    async exists() {
      return datasetAvailable ? { _id: 'available' } : null;
    },
    find(filter) {
      const query = {
        select() {
          return query;
        },
        lean() {
          return query;
        },
        cursor() {
          const matches = jobs.filter((job) => (
            job.sourceDataset === filter.sourceDataset
              && job.normalizedSkills.some((skill) => filter.normalizedSkills.$in.includes(skill))
          ));
          return (async function* generate() {
            yield* matches;
          }());
        },
      };
      return query;
    },
  };
}

function assertSafeError(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.equal(response.body.status, status);
  assert.equal(typeof response.body.message, 'string');
  assert.equal('stack' in response.body, false);
}

describe('job dataset normalization', () => {
  it('normalizes only the explicitly supported skill variants', () => {
    assert.equal(normalizeSkill(' JS  '), 'javascript');
    assert.equal(normalizeSkill('React.js'), 'react');
    assert.equal(normalizeSkill('React Native'), 'react native');
    assert.equal(normalizeSkill('Node.js'), 'node.js');
    assert.equal(normalizeSkill('SpringBoot'), 'spring boot');
  });

  it('splits tags, supports JSON arrays, and deduplicates normalized variants', () => {
    assert.deepEqual(
      parseSkillTags('JavaScript, JS, React.js, React, SpringBoot'),
      ['JavaScript', 'React.js', 'SpringBoot'],
    );
    assert.deepEqual(parseSkillTags('["Python", "SQL"]'), ['Python', 'SQL']);
  });

  it('keeps original job fields while converting match and range values', () => {
    const job = createJobPosting({
      title: 'Backend Developer',
      jobId: 123,
      companyName: 'Example',
      tagsAndSkills: 'Java, SpringBoot',
      experience: '2-4 Yrs',
      salary: '10-15 Lacs PA',
      location: 'Pune',
      ReviewsCount: '14',
      AggregateRating: '4.5',
      minimumExperience: '2',
      maximumExperience: '4',
    });

    assert.equal(job.sourceDataset, JOB_DATASET_ID);
    assert.equal(job.jobId, '123');
    assert.equal(job.companyName, 'Example');
    assert.deepEqual(job.skillNames, ['Java', 'SpringBoot']);
    assert.deepEqual(job.normalizedSkills, ['java', 'spring boot']);
    assert.equal(job.minimumExperience, 2);
    assert.equal(job.maximumExperience, 4);
    assert.equal(job.reviewsCount, 14);
    assert.equal(job.aggregateRating, 4.5);
  });

  it('rejects records without a title, source ID, or matchable tags', () => {
    assert.equal(createJobPosting({ jobId: '1', tagsAndSkills: 'Java' }), null);
    assert.equal(createJobPosting({ title: 'Developer', tagsAndSkills: 'Java' }), null);
    assert.equal(createJobPosting({ title: 'Developer', jobId: '1', tagsAndSkills: '' }), null);
  });
});

describe('recommended jobs API', () => {
  const authDependencies = {
    userModel: createUserModel(),
    authenticateToken: (token) => extractAuthentication(token, testEnvironment),
  };
  const app = createApp({
    authDependencies,
    jobRecommendationDependencies: {
      ...authDependencies,
      resumeModel: createResumeModel(),
      jobPostingModel: createJobPostingModel(),
    },
  });
  const ownerToken = generateToken('recommend-owner@example.com', 'USER', testEnvironment);
  const otherToken = generateToken('recommend-other@example.com', 'USER', testEnvironment);

  it('requires authentication and validates resume ID and limit query parameters', async () => {
    const unauthorized = await request(app).get('/api/jobs/recommended');
    const invalidId = await request(app)
      .get('/api/jobs/recommended?resumeAnalysisId=invalid')
      .set('Authorization', `Bearer ${ownerToken}`);
    const invalidLimit = await request(app)
      .get(`/api/jobs/recommended?resumeAnalysisId=${RESUME_ID}&limit=26`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assertSafeError(unauthorized, 401);
    assertSafeError(invalidId, 400);
    assertSafeError(invalidLimit, 400);
  });

  it('returns ranked jobs using only a resume owned by the authenticated user', async () => {
    const response = await request(app)
      .get(`/api/jobs/recommended?resumeAnalysisId=${RESUME_ID}&limit=2`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.totalMatches, 2);
    assert.equal(response.body.scoreFormula, '70% skill match + 20% experience compatibility + 10% location relevance');
    assert.equal(response.body.jobs[0].jobId, 'recommended-1');
    assert.equal(response.body.jobs[0].matchPercentage, 77);
    assert.deepEqual(response.body.jobs[0].matchedSkills, ['JavaScript', 'React']);
    assert.deepEqual(response.body.jobs[0].missingSkills, ['Node.js']);
    assert.equal(response.body.jobs[0].aggregateRating, 4.2);
    assert.equal(response.body.jobs[1].jobId, 'recommended-2');
    assert.equal(response.body.jobs[1].matchPercentage, 47);
  });

  it('does not reveal another user’s resume analysis', async () => {
    const response = await request(app)
      .get(`/api/jobs/recommended?resumeAnalysisId=${RESUME_ID}`)
      .set('Authorization', `Bearer ${otherToken}`);

    assertSafeError(response, 404);
  });

  it('returns a clear service error when the dataset has not been imported', async () => {
    const unavailableApp = createApp({
      authDependencies,
      jobRecommendationDependencies: {
        ...authDependencies,
        resumeModel: createResumeModel(),
        jobPostingModel: createJobPostingModel({ datasetAvailable: false }),
      },
    });
    const response = await request(unavailableApp)
      .get(`/api/jobs/recommended?resumeAnalysisId=${RESUME_ID}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assertSafeError(response, 503);
    assert.match(response.body.message, /dataset has not been imported/i);
  });

  it('returns an empty result when no skills were detected in the saved resume', async () => {
    const noSkillApp = createApp({
      authDependencies,
      jobRecommendationDependencies: {
        ...authDependencies,
        resumeModel: createResumeModel({ detectedSkills: [] }),
        jobPostingModel: createJobPostingModel(),
      },
    });
    const response = await request(noSkillApp)
      .get(`/api/jobs/recommended?resumeAnalysisId=${RESUME_ID}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.jobs, []);
    assert.equal(response.body.totalMatches, 0);
  });
});
