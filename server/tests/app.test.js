import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import app from '../src/app.js';

describe('Express foundation', () => {
  before(() => {
    process.env.NODE_ENV = 'test';
  });

  after(() => {
    delete process.env.NODE_ENV;
  });

  it('starts the app and returns a safe health response', async () => {
    const response = await request(app).get('/api/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      message: 'CareerLens AI backend is running',
      status: 'ok',
      database: 'disconnected',
    });
    assert.equal(JSON.stringify(response.body).includes('MONGODB_URI'), false);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const response = await request(app).get('/api/not-a-route');

    assert.equal(response.status, 404);
    assert.equal(response.body.message, 'Route not found.');
    assert.equal(response.body.status, 404);
    assert.ok(response.body.timestamp);
  });

  it('applies the configured CORS allowlist', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
  });
});