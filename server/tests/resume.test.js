import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import ResumeAnalysis from '../src/models/ResumeAnalysis.js';
import { MAX_RESUME_SIZE_BYTES, createResumeParserService } from '../src/services/resumeParserService.js';
import { extractAuthentication, generateToken } from '../src/utils/jwt.js';

const testEnvironment = {
  JWT_SECRET: randomBytes(32).toString('hex'),
  JWT_EXPIRATION: '3600000',
};
const OWNER_ID = 'a'.repeat(24);
const OTHER_ID = 'b'.repeat(24);
const BASIC_RESUME_TEXT = 'Backend Engineer\nJava';

function createPdfBuffer() {
  const content = 'BT\n/F1 12 Tf\n72 100 Td\n(Backend Engineer) Tj\n0 -20 Td\n(Java) Tj\nET\n';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}endstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'ascii');
}

function createUserModel() {
  const users = new Map([
    [OWNER_ID, { _id: OWNER_ID, fullName: 'Resume Owner', email: 'resume-owner@example.com', role: 'USER' }],
    [OTHER_ID, { _id: OTHER_ID, fullName: 'Other User', email: 'other-user@example.com', role: 'USER' }],
  ]);
  return {
    async findOne({ email }) {
      return [...users.values()].find((user) => user.email === email) ?? null;
    },
  };
}

function createResumeModel() {
  const records = [];
  let nextId = 1;
  return {
    records,
    async create(document) {
      const record = {
        _id: nextId.toString(16).padStart(24, '0'),
        createdAt: new Date(`2025-01-${String(nextId).padStart(2, '0')}T00:00:00.000Z`),
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
          const direction = order.createdAt < 0 ? -1 : 1;
          return Promise.resolve(selected.sort((left, right) => (
            direction * (left.createdAt.getTime() - right.createdAt.getTime())
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

function safeError(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers['content-type'], /application\/json/);
  assert.equal(response.body.status, status);
  assert.equal(typeof response.body.message, 'string');
  assert.ok(response.body.timestamp);
  assert.equal('stack' in response.body, false);
}

function validResponseKeys(response) {
  assert.deepEqual(Object.keys(response).sort(), [
    'createdAt', 'detectedEducation', 'detectedExperience', 'detectedProjects',
    'detectedSkills', 'fileName', 'fileType', 'id', 'improvementSuggestions',
    'matchScore', 'missingSections', 'overallScore', 'targetRole',
  ].sort());
}

describe('resume analyzer API', () => {
  let app;
  let resumeModel;
  let ownerToken;
  let otherToken;

  beforeEach(() => {
    resumeModel = createResumeModel();
    const userModel = createUserModel();
    const authDependencies = {
      userModel,
      authenticateToken: (token) => extractAuthentication(token, testEnvironment),
    };
    app = createApp({
      authDependencies,
      resumeDependencies: { ...authDependencies, resumeModel },
    });
    ownerToken = generateToken('resume-owner@example.com', 'USER', testEnvironment);
    otherToken = generateToken('other-user@example.com', 'USER', testEnvironment);
  });

  it('rejects a missing file', async () => {
    const response = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('targetRole', 'Backend Developer');

    safeError(response, 400);
    assert.equal(response.body.message, 'Uploaded file is empty or missing.');
  });

  it('rejects an empty file', async () => {
    const response = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.alloc(0), { filename: 'empty.txt', contentType: 'text/plain' });

    safeError(response, 400);
    assert.equal(response.body.message, 'Uploaded file is empty or missing.');
  });

  it('rejects files larger than the Spring 10 MB limit', async () => {
    const response = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.alloc(MAX_RESUME_SIZE_BYTES + 1, 0x61), {
        filename: 'large.txt',
        contentType: 'text/plain',
      });

    safeError(response, 413);
    assert.equal(response.body.message, 'Uploaded file exceeds the 10 MB size limit.');
    assert.equal(resumeModel.records.length, 0);
  });

  it('rejects unsupported extensions', async () => {
    const response = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from('not an image'), { filename: 'resume.png', contentType: 'image/png' });

    safeError(response, 400);
    assert.equal(response.body.message, 'Invalid file format. Only PDF, DOCX, DOC, and TXT files are supported.');
  });

  it('rejects extension and content mismatches', async () => {
    const response = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from('plain text'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    safeError(response, 400);
    assert.equal(response.body.message, 'The uploaded file content does not match its file extension.');
  });

  it('requires JWT authentication for analyze, history, and single-record routes', async () => {
    const analyze = await request(app)
      .post('/api/resume/analyze')
      .attach('file', Buffer.from(BASIC_RESUME_TEXT), { filename: 'resume.txt', contentType: 'text/plain' });
    const history = await request(app).get('/api/resume/history');
    const single = await request(app).get(`/api/resume/${'1'.repeat(24)}`);

    safeError(analyze, 401);
    safeError(history, 401);
    safeError(single, 401);
  });

  it('analyzes valid TXT and returns the Spring response structure without raw text', async () => {
    const response = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from(BASIC_RESUME_TEXT), { filename: 'resume.txt', contentType: 'text/plain' });

    assert.equal(response.status, 200);
    validResponseKeys(response.body);
    assert.equal(response.body.fileName, 'resume.txt');
    assert.equal(response.body.fileType, 'text/plain');
    assert.equal(response.body.overallScore, 51);
    assert.equal(response.body.targetRole, 'General Software Engineer');
    assert.equal(response.body.matchScore, 40);
    assert.deepEqual(response.body.detectedSkills, ['Java']);
    assert.equal('rawText' in response.body, false);
    assert.equal(JSON.stringify(response.body).includes(BASIC_RESUME_TEXT), false);
    assert.equal(resumeModel.records.length, 1);
    assert.equal(resumeModel.records[0].user, OWNER_ID);
    assert.equal(resumeModel.records[0].rawText, BASIC_RESUME_TEXT);
    assert.equal('buffer' in resumeModel.records[0], false);
  });

  it('does not log uploaded resume contents during analysis', async () => {
    const resumeText = `Private resume text ${randomBytes(16).toString('hex')}`;
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };
    const output = [];
    for (const method of Object.keys(originalConsole)) {
      console[method] = (...values) => output.push(values.map(String).join(' '));
    }

    let response;
    try {
      response = await request(app)
        .post('/api/resume/analyze')
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', Buffer.from(resumeText), { filename: 'private.txt', contentType: 'text/plain' });
    } finally {
      Object.assign(console, originalConsole);
    }

    assert.equal(response.status, 200);
    assert.equal(output.join('\n').includes(resumeText), false);
  });

  it('uses optional targetRole and matches the Spring role dictionary', async () => {
    const response = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('targetRole', '  frontend developer  ')
      .attach('file', Buffer.from('JavaScript React HTML CSS REST API Git'), {
        filename: 'frontend.txt',
        contentType: 'text/plain',
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.overallScore, 56);
    assert.equal(response.body.targetRole, 'frontend developer');
    assert.equal(response.body.matchScore, 75);
    assert.deepEqual(response.body.detectedSkills, ['JavaScript', 'HTML', 'CSS', 'React', 'Git', 'REST API']);
  });

  it('ignores client-supplied ownership fields and stores only the authenticated owner', async () => {
    const response = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('userId', OTHER_ID)
      .attach('file', Buffer.from(BASIC_RESUME_TEXT), { filename: 'resume.txt', contentType: 'text/plain' });

    assert.equal(response.status, 200);
    assert.equal(resumeModel.records[0].user, OWNER_ID);
    assert.equal('user' in response.body, false);
  });

  it('returns only the authenticated user history ordered newest first', async () => {
    const first = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from('Backend Engineer\nJava'), { filename: 'first.txt', contentType: 'text/plain' });
    const second = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from('Frontend Developer\nReact'), { filename: 'second.txt', contentType: 'text/plain' });
    await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${otherToken}`)
      .attach('file', Buffer.from('Other User\nPython'), { filename: 'other.txt', contentType: 'text/plain' });

    const response = await request(app)
      .get('/api/resume/history?userId=' + OTHER_ID)
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 2);
    assert.deepEqual(response.body.map((item) => item.id), [second.body.id, first.body.id]);
    response.body.forEach(validResponseKeys);
  });

  it('returns an empty history array for a user without analyses', async () => {
    const response = await request(app)
      .get('/api/resume/history')
      .set('Authorization', `Bearer ${otherToken}`);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, []);
  });

  it('returns a single owned analysis and hides another user analysis as not found', async () => {
    const own = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from(BASIC_RESUME_TEXT), { filename: 'owned.txt', contentType: 'text/plain' });
    const other = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${otherToken}`)
      .attach('file', Buffer.from('Python'), { filename: 'other.txt', contentType: 'text/plain' });

    const ownResponse = await request(app)
      .get(`/api/resume/${own.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    const foreignResponse = await request(app)
      .get(`/api/resume/${other.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    assert.equal(ownResponse.status, 200);
    validResponseKeys(ownResponse.body);
    safeError(foreignResponse, 404);
    assert.equal(foreignResponse.body.message, `Resume analysis not found with ID: ${other.body.id}`);
  });

  it('rejects malformed Mongo IDs safely', async () => {
    const response = await request(app)
      .get('/api/resume/not-an-object-id')
      .set('Authorization', `Bearer ${ownerToken}`);
    safeError(response, 400);
    assert.equal(response.body.message, 'Invalid resume analysis ID.');
  });

  it('does not expose parser error details or persist a result after parsing fails', async () => {
    const userModel = createUserModel();
    const parserService = {
      async extractText() {
        throw new Error('private document contents and local path');
      },
    };
    const resumeDependencies = {
      userModel,
      authenticateToken: (token) => extractAuthentication(token, testEnvironment),
      parserService,
      resumeModel,
    };
    const isolatedApp = createApp({
      authDependencies: resumeDependencies,
      resumeDependencies,
    });
    const response = await request(isolatedApp)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from('resume'), { filename: 'resume.txt', contentType: 'text/plain' });

    safeError(response, 500);
    assert.equal(JSON.stringify(response.body).includes('private document'), false);
    assert.equal(resumeModel.records.length, 0);
  });
});

describe('resume document parser', () => {
  it('extracts text from a valid PDF Buffer using the installed parser', async () => {
    const parser = createResumeParserService();
    const result = await parser.extractText({
      originalname: 'generated-resume.pdf',
      mimetype: 'application/pdf',
      buffer: createPdfBuffer(),
    });

    assert.match(result.text, /Backend Engineer/);
    assert.match(result.text, /Java/);
  });

  it('maps malformed DOCX and DOC parser failures to safe client errors', async () => {
    const parser = createResumeParserService();
    const malformedFiles = [
      {
        originalname: 'invalid.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]),
      },
      {
        originalname: 'invalid.doc',
        mimetype: 'application/msword',
        buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00]),
      },
    ];

    for (const file of malformedFiles) {
      await assert.rejects(parser.extractText(file), (error) => {
        assert.equal(error.status, 400);
        assert.ok([
          'The uploaded document could not be parsed.',
          'Could not extract any text from the provided document.',
        ].includes(error.message));
        assert.equal(error.message.includes('invalid.doc'), false);
        return true;
      });
    }
  });

  it('dispatches valid PDF, DOCX, and DOC signatures to their respective extractors', async () => {
    const calls = [];
    const parser = createResumeParserService({
      extractors: {
        async pdf() { calls.push('pdf'); return 'PDF body'; },
        async docx() { calls.push('docx'); return 'DOCX body'; },
        async doc() { calls.push('doc'); return 'DOC body'; },
      },
    });

    const pdf = await parser.extractText({
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7 content'),
    });
    const docx = await parser.extractText({
      originalname: 'resume.docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]),
    });
    const doc = await parser.extractText({
      originalname: 'resume.doc',
      mimetype: 'application/msword',
      buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00]),
    });

    assert.deepEqual(calls, ['pdf', 'docx', 'doc']);
    assert.equal(pdf.text, 'PDF body');
    assert.equal(docx.text, 'DOCX body');
    assert.equal(doc.text, 'DOC body');
  });

  it('does not expose a temporary path or persist uploaded bytes', async () => {
    let uploadedFile;
    const parser = createResumeParserService();
    const parserSpy = {
      async extractText(file) {
        uploadedFile = file;
        return parser.extractText(file);
      },
    };
    const userModel = createUserModel();
    const resumeModel = createResumeModel();
    const authDependencies = {
      userModel,
      authenticateToken: (token) => extractAuthentication(token, testEnvironment),
    };
    const app = createApp({
      authDependencies,
      resumeDependencies: { ...authDependencies, resumeModel, parserService: parserSpy },
    });
    const response = await request(app)
      .post('/api/resume/analyze')
      .set('Authorization', `Bearer ${generateToken('resume-owner@example.com', 'USER', testEnvironment)}`)
      .attach('file', Buffer.from(BASIC_RESUME_TEXT), { filename: 'resume.txt', contentType: 'text/plain' });

    assert.equal(response.status, 200);
    assert.equal(Buffer.isBuffer(uploadedFile.buffer), true);
    assert.equal('path' in uploadedFile, false);
    assert.equal('destination' in uploadedFile, false);
    assert.equal('buffer' in resumeModel.records[0], false);
  });
});

describe('ResumeAnalysis Mongoose model', () => {
  it('persists confirmed analysis fields while hiding user ownership and extracted raw text', () => {
    const analysis = new ResumeAnalysis({
      user: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      fileName: 'resume.txt',
      fileType: 'text/plain',
      overallScore: 51,
      targetRole: 'General Software Engineer',
      matchScore: 40,
      rawText: BASIC_RESUME_TEXT,
      detectedSkills: ['Java'],
    });
    const response = analysis.toJSON();

    assert.equal(ResumeAnalysis.modelName, 'ResumeAnalysis');
    assert.equal(ResumeAnalysis.schema.options.timestamps.createdAt, true);
    assert.equal(ResumeAnalysis.schema.options.timestamps.updatedAt, false);
    assert.equal(ResumeAnalysis.schema.path('rawText').options.select, false);
    assert.equal(ResumeAnalysis.schema.path('user').options.select, false);
    assert.equal(response.fileName, 'resume.txt');
    assert.deepEqual(response.detectedSkills, ['Java']);
    assert.equal('rawText' in response, false);
    assert.equal('user' in response, false);
    assert.equal('buffer' in response, false);
  });
});