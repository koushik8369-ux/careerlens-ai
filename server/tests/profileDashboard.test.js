import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import { extractAuthentication, generateToken } from '../src/utils/jwt.js';

const testEnvironment = {
  JWT_SECRET: randomBytes(32).toString('hex'),
  JWT_EXPIRATION: '3600000',
};

function createUser({ id, email, fullName, profile }) {
  const user = {
    _id: id,
    email,
    fullName,
    role: 'USER',
    passwordHash: randomBytes(32).toString('hex'),
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    profile: profile ? structuredClone(profile) : undefined,
    async save() {
      return user;
    },
  };
  return user;
}

function createUserModel(users) {
  return {
    async findOne({ email }) {
      return [...users.values()].find((user) => user.email === email) ?? null;
    },
    async findById(id) {
      return users.get(id) ?? null;
    },
  };
}

function makeProfile(overrides = {}) {
  return {
    phone: '+1 555 0100',
    education: 'Computer Science',
    college: 'Example College',
    graduationYear: 2027,
    careerGoal: 'Backend Engineer',
    bio: 'Building secure systems',
    location: 'Seattle',
    skills: ['Java', 'SQL'],
    createdAt: new Date('2025-02-01T00:00:00.000Z'),
    updatedAt: new Date('2025-02-02T00:00:00.000Z'),
    ...overrides,
  };
}

function assertSafeError(response, expectedStatus) {
  assert.equal(response.status, expectedStatus);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.equal(response.body.status, expectedStatus);
  assert.equal(typeof response.body.message, 'string');
  assert.ok(response.body.timestamp);
  assert.equal('stack' in response.body, false);
}

describe('embedded profile model', () => {
  it('stores profile data on User without serializing auth fields or a separate profile ID', () => {
    const user = new User({
      fullName: 'Owner User',
      email: 'owner@example.com',
      passwordHash: randomBytes(32).toString('hex'),
      role: 'USER',
      profile: makeProfile(),
    });
    const response = user.toJSON();

    assert.equal(User.modelName, 'User');
    assert.equal(response.profile.education, 'Computer Science');
    assert.deepEqual(response.profile.skills, ['Java', 'SQL']);
    assert.equal('_id' in response.profile, false);
    assert.equal('passwordHash' in response, false);
    assert.equal('password' in response, false);
  });
});

describe('profile and dashboard APIs', () => {
  let app;
  let users;
  let owner;
  let otherUser;
  let ownerToken;
  let otherToken;

  beforeEach(() => {
    owner = createUser({
      id: 'profile-user-1',
      email: 'owner@example.com',
      fullName: 'Owner User',
      profile: makeProfile(),
    });
    otherUser = createUser({
      id: 'profile-user-2',
      email: 'other@example.com',
      fullName: 'Other User',
      profile: makeProfile({
        education: 'Mathematics',
        college: 'Other College',
        careerGoal: 'Data Analyst',
        skills: ['Python'],
      }),
    });
    users = new Map([[owner._id, owner], [otherUser._id, otherUser]]);
    const userModel = createUserModel(users);
    app = createApp({
      authDependencies: {
        userModel,
        authenticateToken: (token) => extractAuthentication(token, testEnvironment),
      },
    });
    ownerToken = generateToken(owner.email, owner.role, testEnvironment);
    otherToken = generateToken(otherUser.email, otherUser.role, testEnvironment);
  });

  it('GET /api/profile returns the Spring-compatible response shape for the JWT user', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(response.body).sort(), [
      'bio', 'careerGoal', 'college', 'createdAt', 'education', 'email', 'fullName',
      'graduationYear', 'location', 'phone', 'skills', 'updatedAt', 'userId',
    ].sort());
    assert.equal(response.body.userId, owner._id);
    assert.equal(response.body.fullName, owner.fullName);
    assert.equal(response.body.email, owner.email);
    assert.deepEqual(response.body.skills, ['Java', 'SQL']);
    assert.equal(response.body.createdAt, '2025-02-01T00:00:00.000Z');
    assert.equal('password' in response.body, false);
    assert.equal('passwordHash' in response.body, false);
    assert.equal('role' in response.body, false);
    assert.equal('token' in response.body, false);
  });

  it('GET /api/profile rejects requests without a JWT', async () => {
    assertSafeError(await request(app).get('/api/profile'), 401);
  });

  it('GET /api/profile rejects an invalid JWT', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalid-token');
    assertSafeError(response, 401);
  });

  it('GET /api/profile returns 404 when the authenticated user has no profile', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${generateToken('no-profile@example.com', 'USER', testEnvironment)}`);
    assertSafeError(response, 401);

    const noProfileUser = createUser({
      id: 'profile-user-3',
      email: 'no-profile@example.com',
      fullName: 'No Profile User',
    });
    users.set(noProfileUser._id, noProfileUser);
    const missingProfile = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${generateToken(noProfileUser.email, 'USER', testEnvironment)}`);
    assertSafeError(missingProfile, 404);
    assert.equal(missingProfile.body.message, 'User profile not found');
  });

  it('PUT /api/profile upserts and normalizes only the allowed profile fields', async () => {
    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        phone: '  ',
        education: '  Computer Science  ',
        college: '  New College ',
        graduationYear: 2028,
        careerGoal: ' Platform Engineer ',
        bio: null,
        location: ' Remote ',
        skills: [' Rust ', 'Rust', null, '', 'MongoDB'],
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.phone, null);
    assert.equal(response.body.education, 'Computer Science');
    assert.equal(response.body.college, 'New College');
    assert.equal(response.body.graduationYear, 2028);
    assert.equal(response.body.careerGoal, 'Platform Engineer');
    assert.equal(response.body.bio, null);
    assert.equal(response.body.location, 'Remote');
    assert.deepEqual(response.body.skills, ['Rust', 'MongoDB']);
    assert.equal(owner.profile.createdAt.toISOString(), '2025-02-01T00:00:00.000Z');
    assert.ok(owner.profile.updatedAt instanceof Date);
  });

  it('PUT /api/profile ignores a supplied user ID and cannot update another user', async () => {
    const otherProfileBefore = structuredClone(otherUser.profile);
    const response = await request(app)
      .put('/api/profile?userId=profile-user-2')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        userId: otherUser._id,
        careerGoal: 'Owner Goal',
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.userId, owner._id);
    assert.equal(response.body.careerGoal, 'Owner Goal');
    assert.deepEqual(otherUser.profile, otherProfileBefore);
  });

  it('PUT /api/profile does not allow the client to change role', async () => {
    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ careerGoal: 'Secure Engineer', role: 'ADMIN' });

    assert.equal(response.status, 200);
    assert.equal(owner.role, 'USER');
    assert.equal('role' in response.body, false);
  });

  it('PUT /api/profile does not allow the client to change email or auth fields', async () => {
    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        careerGoal: 'Platform Engineer',
        email: 'changed@example.com',
        fullName: 'Changed Name',
        password: randomBytes(24).toString('hex'),
        passwordHash: randomBytes(32).toString('hex'),
      });

    assert.equal(response.status, 200);
    assert.equal(owner.email, 'owner@example.com');
    assert.equal(owner.fullName, 'Owner User');
    assert.equal(response.body.email, 'owner@example.com');
    assert.equal('password' in response.body, false);
    assert.equal('passwordHash' in response.body, false);
  });

  it('PUT /api/profile rejects values outside the Spring validation constraints', async () => {
    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        phone: 'p'.repeat(31),
        graduationYear: 1800,
        skills: ['s'.repeat(81)],
      });

    assertSafeError(response, 400);
    assert.equal(response.body.errors.phone, 'Phone must be at most 30 characters');
    assert.equal(response.body.errors.graduationYear, 'Graduation year must be valid');
    assert.equal(response.body.errors.skills, 'Skill must be at most 80 characters');
    assert.equal(owner.profile.careerGoal, 'Backend Engineer');
  });

  it('GET /api/dashboard returns the expected metrics for the JWT user only', async () => {
    const response = await request(app)
      .get('/api/dashboard?userId=profile-user-2')
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      userId: owner._id,
      fullName: owner.fullName,
      email: owner.email,
      careerGoal: owner.profile.careerGoal,
      education: owner.profile.education,
      profileCompletionPercentage: 100,
      skillCount: 2,
      profileStatus: 'COMPLETE',
    });
    assert.notEqual(response.body.userId, otherUser._id);
    assert.equal('password' in response.body, false);
    assert.equal('passwordHash' in response.body, false);
    assert.equal('role' in response.body, false);
  });

  it('GET /api/dashboard rejects requests without a JWT', async () => {
    assertSafeError(await request(app).get('/api/dashboard'), 401);
  });

  it('GET /api/dashboard returns the Spring defaults when the user has no profile', async () => {
    const noProfileUser = createUser({
      id: 'profile-user-3',
      email: 'no-profile@example.com',
      fullName: 'No Profile User',
    });
    users.set(noProfileUser._id, noProfileUser);
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${generateToken(noProfileUser.email, 'USER', testEnvironment)}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      userId: noProfileUser._id,
      fullName: noProfileUser.fullName,
      email: noProfileUser.email,
      careerGoal: null,
      education: null,
      profileCompletionPercentage: 0,
      skillCount: 0,
      profileStatus: 'NOT_STARTED',
    });
  });
});