import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { describe, it } from 'node:test';
import { connectDatabase, getMongoUri } from '../src/config/database.js';
import { getAllowedOrigins } from '../src/config/cors.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const fakeDatabaseUser = `test-${randomBytes(8).toString('hex')}`;
const fakeDatabasePassword = randomBytes(24).toString('hex');

describe('foundation configuration and middleware', () => {
  it('loads the MongoDB URI from the supplied environment', () => {
    assert.equal(
      getMongoUri({ MONGODB_URI: 'mongodb://localhost:27017/careerlens_test' }),
      'mongodb://localhost:27017/careerlens_test',
    );
    assert.throws(() => getMongoUri({}), /MONGODB_URI/);
  });

  it('connects using the configured URI without logging it', async () => {
    const calls = [];
    const logs = [];
    const mongoUri = `mongodb://${fakeDatabaseUser}:${fakeDatabasePassword}@localhost:27017/careerlens_test`;
    const client = {
      async connect(uri, options) {
        calls.push({ uri, options });
      },
    };
    const logger = { info: (message) => logs.push(message), error: (message) => logs.push(message) };

    await connectDatabase({
      env: { MONGODB_URI: mongoUri },
      client,
      logger,
    });

    assert.equal(calls[0].uri, mongoUri);
    assert.equal(calls[0].options.serverSelectionTimeoutMS, 5000);
    assert.equal(logs.join(' ').includes(fakeDatabasePassword), false);
  });

  it('sanitizes database connection failures', async () => {
    const logs = [];
    const mongoUri = `mongodb://${fakeDatabaseUser}:${fakeDatabasePassword}@host/database`;
    const client = {
      async connect() {
        const error = new Error(`failed for ${mongoUri}`);
        error.name = 'MongoServerSelectionError';
        throw error;
      },
    };
    const logger = { info() {}, error: (message) => logs.push(message) };

    await assert.rejects(
      connectDatabase({ env: { MONGODB_URI: mongoUri }, client, logger }),
      { message: 'MongoDB connection failed. Check MONGODB_URI and database availability.' },
    );
    assert.equal(logs.join(' ').includes(fakeDatabasePassword), false);
    assert.equal(logs.join(' ').includes('mongodb://'), false);
  });

  it('requires explicit non-wildcard CORS origins in production', () => {
    assert.deepEqual(getAllowedOrigins({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS: 'https://careerlens.example, https://www.careerlens.example',
    }), ['https://careerlens.example', 'https://www.careerlens.example']);
    assert.throws(() => getAllowedOrigins({ NODE_ENV: 'production' }), /explicit origins/);
    assert.throws(() => getAllowedOrigins({ NODE_ENV: 'production', CORS_ALLOWED_ORIGINS: '*' }), /Wildcard/);
  });

  it('returns JSON errors without exposing internal messages or stacks', () => {
    let statusCode;
    let body;
    const response = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(value) {
        body = value;
        return this;
      },
    };

    errorHandler(new Error('mongodb://user:password@host/database'), {}, response, () => {});

    assert.equal(statusCode, 500);
    assert.equal(body.message, 'An unexpected internal error occurred.');
    assert.equal(body.status, 500);
    assert.ok(body.timestamp);
    assert.equal(JSON.stringify(body).includes('password'), false);
    assert.equal(JSON.stringify(body).includes('stack'), false);
  });
});