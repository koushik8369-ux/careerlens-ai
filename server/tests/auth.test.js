import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import { extractAuthentication, generateToken, getJwtConfiguration } from '../src/utils/jwt.js';

const testEnvironment = {
  JWT_SECRET: randomBytes(32).toString('hex'),
  JWT_EXPIRATION: '3600000',
};
const registrationPassword = randomBytes(18).toString('base64url');
const incorrectPassword = randomBytes(18).toString('base64url');
const mismatchedConfirmation = randomBytes(18).toString('base64url');
const shortTestPassword = 'x'.repeat(5);

function createFakeUserModel() {
  const users = new Map();
  let nextId = 1;

  return {
    users,

    async exists({ email }) {
      return users.has(email);
    },

    async create(document) {
      if (users.has(document.email)) {
        const error = new Error('duplicate email');
        error.code = 11000;
        error.keyPattern = { email: 1 };
        throw error;
      }
      const user = {
        _id: `test-user-${nextId++}`,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        ...document,
      };
      users.set(user.email, user);
      return user;
    },

    findOne({ email }) {
      const user = users.get(email) ?? null;
      return {
        select: async () => user,
        then(resolve, reject) {
          return Promise.resolve(user).then(resolve, reject);
        },
      };
    },
  };
}

const registration = {
  fullName: 'Career Lens User',
  email: '  user@example.com  ',
  password: registrationPassword,
  confirmPassword: registrationPassword,
};

function assertSafeError(response, expectedStatus) {
  assert.equal(response.status, expectedStatus);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.equal(response.body.status, expectedStatus);
  assert.equal(typeof response.body.message, 'string');
  assert.ok(response.body.timestamp);
  assert.equal(JSON.stringify(response.body).includes('stack'), false);
  assert.equal(JSON.stringify(response.body).includes(testEnvironment.JWT_SECRET), false);
}

describe('authentication API', () => {
  let app;
  let userModel;

  beforeEach(() => {
    userModel = createFakeUserModel();
    app = createApp({
      authDependencies: {
        userModel,
        createToken: (email, role) => generateToken(email, role, testEnvironment),
        authenticateToken: (token) => extractAuthentication(token, testEnvironment),
      },
    });
  });

  it('registers a user and returns the safe Spring-compatible user response', async () => {
    const response = await request(app).post('/api/auth/register').send(registration);

    assert.equal(response.status, 201);
    assert.deepEqual(Object.keys(response.body).sort(), ['createdAt', 'email', 'fullName', 'id', 'role']);
    assert.equal(response.body.email, 'user@example.com');
    assert.equal(response.body.fullName, 'Career Lens User');
    assert.equal(response.body.role, 'USER');
    assert.equal('password' in response.body, false);
    assert.equal('passwordHash' in response.body, false);
  });

  it('rejects duplicate normalized email addresses with HTTP 409', async () => {
    await request(app).post('/api/auth/register').send(registration);
    const response = await request(app).post('/api/auth/register').send({
      ...registration,
      email: 'USER@example.com',
    });

    assertSafeError(response, 409);
    assert.equal(response.body.message, 'Email already registered');
  });

  it('stores a bcrypt hash rather than a plaintext password', async () => {
    const response = await request(app).post('/api/auth/register').send(registration);
    const storedUser = userModel.users.get('user@example.com');

    assert.equal(response.status, 201);
    assert.notEqual(storedUser.passwordHash, registration.password);
    assert.equal(await bcrypt.compare(registration.password, storedUser.passwordHash), true);
    assert.equal(JSON.stringify(response.body).includes(storedUser.passwordHash), false);
  });

  it('assigns USER regardless of a client-supplied role', async () => {
    const response = await request(app).post('/api/auth/register').send({
      ...registration,
      role: 'ADMIN',
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.role, 'USER');
  });

  it('enforces registration password and confirmation validation', async () => {
    const shortPasswordResponse = await request(app).post('/api/auth/register').send({
      ...registration,
      password: shortTestPassword,
      confirmPassword: shortTestPassword,
    });
    const mismatchedPassword = await request(app).post('/api/auth/register').send({
      ...registration,
      confirmPassword: mismatchedConfirmation,
    });

    assertSafeError(shortPasswordResponse, 400);
    assert.equal(shortPasswordResponse.body.errors.password, 'Password must be at least 6 characters long');
    assertSafeError(mismatchedPassword, 400);
    assert.equal(mismatchedPassword.body.errors.confirmPassword, 'Passwords do not match');
  });

  it('logs in with a normalized email and returns an email-subject JWT with role', async () => {
    await request(app).post('/api/auth/register').send(registration);
    const response = await request(app).post('/api/auth/login').send({
      email: ' USER@EXAMPLE.COM ',
      password: registration.password,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Login successful');
    assert.equal(response.body.email, 'user@example.com');
    assert.equal(response.body.role, 'USER');
    assert.equal(typeof response.body.token, 'string');
    assert.equal('passwordHash' in response.body, false);
    const claims = jwt.decode(response.body.token);
    assert.equal(claims.sub, 'user@example.com');
    assert.equal(claims.role, 'USER');
    assert.equal(claims.exp - claims.iat, 3600);
  });

  it('rejects an invalid password without distinguishing the account state', async () => {
    await request(app).post('/api/auth/register').send(registration);
    const response = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: incorrectPassword,
    });

    assertSafeError(response, 401);
    assert.equal(response.body.message, 'Invalid email or password');
  });

  it('rejects an unknown email with the same credential error', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'unknown@example.com',
      password: incorrectPassword,
    });

    assertSafeError(response, 401);
    assert.equal(response.body.message, 'Invalid email or password');
  });

  it('allows a valid JWT to access /api/auth/me without exposing hashes', async () => {
    await request(app).post('/api/auth/register').send(registration);
    const login = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: registration.password,
    });
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.email, 'user@example.com');
    assert.equal(response.body.role, 'USER');
    assert.equal('password' in response.body, false);
    assert.equal('passwordHash' in response.body, false);
  });

  it('rejects a missing bearer token with safe JSON', async () => {
    const response = await request(app).get('/api/auth/me');

    assertSafeError(response, 401);
    assert.equal(response.body.message, 'Authentication required.');
  });

  it('rejects a malformed bearer token with safe JSON', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-valid-token');

    assertSafeError(response, 401);
    assert.equal(response.body.message, 'Invalid or expired authentication token.');
  });

  it('rejects an expired bearer token with safe JSON', async () => {
    await request(app).post('/api/auth/register').send(registration);
    const expiredToken = jwt.sign(
      { role: 'USER' },
      testEnvironment.JWT_SECRET,
      { algorithm: 'HS256', subject: 'user@example.com', expiresIn: -1 },
    );
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    assertSafeError(response, 401);
    assert.equal(response.body.message, 'Invalid or expired authentication token.');
  });
});

describe('Mongoose User model security', () => {
  it('requires an environment-provided JWT secret of at least 32 bytes', () => {
    const shortSecret = Buffer.alloc(10).toString('hex');
    assert.throws(() => getJwtConfiguration({}), /JWT_SECRET/);
    assert.throws(() => getJwtConfiguration({ JWT_SECRET: shortSecret }), /32 UTF-8 bytes/);
    assert.throws(() => getJwtConfiguration({
      JWT_SECRET: testEnvironment.JWT_SECRET,
      JWT_EXPIRATION: '0',
    }), /positive integer/);
    assert.equal(getJwtConfiguration(testEnvironment).expiresInSeconds, 3600);
  });

  it('uses unique normalized email, timestamps, a hidden hash, and the USER role default', () => {
    const passwordHash = '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuu123456789';
    const user = new User({
      fullName: 'Career Lens User',
      email: ' USER@example.com ',
      passwordHash,
    });
    const response = user.toJSON();

    assert.equal(User.schema.path('email').options.unique, true);
    assert.equal(User.schema.path('email').options.lowercase, true);
    assert.equal(User.schema.options.timestamps, true);
    assert.equal(User.schema.path('passwordHash').options.select, false);
    assert.equal(user.role, 'USER');
    assert.equal('passwordHash' in response, false);
    assert.equal('password' in response, false);
  });
});