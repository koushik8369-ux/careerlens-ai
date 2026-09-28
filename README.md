# CareerLens AI

CareerLens AI is a Smart Career Intelligence Platform for analyzing career profiles, resumes, job requirements, skill gaps, and career development actions.

## Active Architecture

```text
React 18 + TypeScript + Vite
          ↓ REST / JWT
Node.js + Express.js
          ↓ Mongoose
MongoDB
```

The active API is in `server/`. The original Spring Boot/MySQL implementation in `backend/` is retained as a migration reference and is not used by the active frontend or Render blueprint. Existing MySQL records are not automatically imported into MongoDB; keep the old database available until a separate data-transfer plan is completed.

## Features

- Registration, login, bcrypt password hashing, JWT authentication, and protected routes
- User profile and dashboard
- Resume Analyzer: PDF, DOCX, DOC, and TXT uploads; deterministic scoring, role matching, and history
- Job Intelligence: deterministic job description analysis, skill matching, recommendations, and history
- Career Assistant conversations and deterministic responses
- Resume improvement, skill roadmap, project recommendations, interview preparation, and action plan
- Career plan generation, retrieval, ordered task completion, and archival of the previous active plan
- Optional OpenAI-compatible career AI provider; deterministic behavior is the default

All user-owned data is scoped to the authenticated JWT identity. The React application calls Express only; MongoDB credentials remain server-side.

## API

All endpoints use the `/api` prefix. Health, registration, and login are public; all other routes require `Authorization: Bearer <token>`.

| Method | Endpoint |
| --- | --- |
| GET | `/api/health` |
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| GET | `/api/auth/me` |
| GET, PUT | `/api/profile` |
| GET | `/api/dashboard` |
| POST | `/api/resume/analyze` |
| GET | `/api/resume/history` |
| GET | `/api/resume/:id` |
| POST | `/api/job-intelligence/analyze` |
| GET | `/api/job-intelligence/history` |
| GET | `/api/job-intelligence/:id` |
| POST, GET | `/api/career-assistant/conversations` |
| GET, POST | `/api/career-assistant/conversations/:conversationId/messages` |
| POST | `/api/career-assistant/action-plan` |
| POST | `/api/career-assistant/resume-improvement` |
| POST | `/api/career-assistant/roadmap` |
| POST | `/api/career-assistant/projects` |
| POST | `/api/career-assistant/interview-preparation` |
| POST | `/api/career-plans` |
| GET | `/api/career-plans/current` |
| GET | `/api/career-plans/:id` |
| PATCH | `/api/career-plans/:id/items/:itemId` |

Resume analysis accepts multipart form data with a required `file` and optional `targetRole`. Supported types are PDF, DOCX, DOC, and TXT; uploads are limited to 10 MB and processed in memory.

MongoDB collections are `users`, `resumeanalyses`, `jobanalyses`, `careerassistantconversations`, `careerassistantmessages`, and `careerplans`. Profile data is embedded in `users`; career-plan items are embedded in their plan. ObjectId API values are strings.

## Local Development

Requirements: Node.js 22.3 or newer, npm, and a local MongoDB instance or MongoDB Atlas URI.

From `server/`, install dependencies and create a local environment file from the example. Set `MONGODB_URI` to your development database and `JWT_SECRET` to a private random value of at least 32 UTF-8 bytes. Do not commit `.env` files.

```powershell
cd server
npm install
npm run dev
```

The API defaults to `http://localhost:5000`. The frontend defaults to `http://localhost:5173`; Vite proxies development `/api` calls to Express on port `5000`. Production builds use the configured `VITE_API_BASE_URL`, whose example points to `http://localhost:5000/api`.

Run the frontend in another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

## AI Provider

`AI_PROVIDER=deterministic` is the default and requires no external AI service. To enable the optional OpenAI-compatible provider, set `AI_PROVIDER=llm` and configure `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_TIMEOUT` as server-side environment variables. The provider calls `/chat/completions`, validates structured JSON results, and does not expose upstream response bodies. Tests use mocked fetch and never call an external LLM.

## Deployment

`render.yaml` defines a Node web service and React static site. It does not create a database. Configure `MONGODB_URI` with an externally managed MongoDB deployment (for example, Atlas), set an explicit `CORS_ALLOWED_ORIGINS` frontend origin, and provide the generated `JWT_SECRET` through Render. `VITE_API_BASE_URL` is a frontend build-time setting that must point to the deployed Express API and end in `/api`.

The Node service starts with `npm start`, binds to `0.0.0.0`, and uses Render's `PORT`. The frontend is built with `npm ci && npm run build` and publishes `dist`.

## Validation

Run the database-free backend suite and frontend production build:

```powershell
npm --prefix server install
npm --prefix server test
npm --prefix frontend ci
npm --prefix frontend run build
```

Backend tests use injected fake models and mocked LLM calls; they do not require a running MongoDB service or production credentials.