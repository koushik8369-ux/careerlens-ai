# JOBFIT AI

JOBFIT AI is an AI-powered job fit and career readiness platform that analyzes a user's profile, resume, skills, and target job requirements to identify job fit and career gaps.

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
- Resume Analyzer: PDF, DOCX, DOC, and TXT uploads; evidence-based scoring, extracted profile and resume sections, ATS-style checks, job-market insights, recommendations, and history
- Job Intelligence: deterministic job description analysis, skill matching, recommendations, and history
- Career Assistant conversations grounded in owner-scoped profile, resume, job-fit, market snapshot, and active-plan context; deterministic by default with suggested follow-ups and bounded conversation history in LLM mode
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
| GET | `/api/jobs/recommended?resumeAnalysisId=<id>&limit=<1-25>` |
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

Resume analysis remains behind the existing authenticated endpoints and stores its extracted result in the owner-scoped `resumeanalyses` collection; extracted raw text stays private. Its deterministic ATS-style checklist score is 0–100: contact information (10), summary quality (10), detected skills (up to 15), target-role keyword coverage (10), experience evidence (up to 20), education (up to 10), projects (up to 10), certifications (5), and section completeness (10). This practical checklist is not an official ATS score. Role-fit percentage is the share of expected target-role skills detected in the resume, with no score floor or bonus. ATS checks also report detected action verbs and quantified achievement lines. Role keywords, weak/missing sections, and improvement suggestions are based on parsed resume content. When the job dataset is available, saved analysis also includes ranked job matches and skill gaps from the existing job recommendation service; if it is unavailable, the resume analysis still completes with an explicit unavailable status.

MongoDB collections are `users`, `resumeanalyses`, `jobanalyses`, `jobpostings`, `careerassistantconversations`, `careerassistantmessages`, and `careerplans`. Profile data is embedded in `users`; career-plan items are embedded in their plan. ObjectId API values are strings.

### Dataset job recommendations

Job recommendations use the authenticated user's saved resume analysis (`resumeAnalysisId`); client-provided skill lists are not trusted. `GET /api/jobs/recommended` returns at most 10 ranked matches by default and accepts a `limit` from 1 to 25. Jobs are queried from the indexed `jobpostings` collection using normalized resume skills, not by reading the workbook for each request. It returns `503` with an explicit message until the dataset has been imported. The dataset contains no job URL, so recommendations do not include invented apply links.

The `server` package includes a streaming importer for the local Kaggle XLSX file. It skips rows without a title, job ID, or usable skill tags; keeps the first valid row for a duplicate job ID; and upserts the remaining records in batches. A dry run validates the workbook without connecting to MongoDB. Neither the workbook nor converted job data belongs in the repository.

```powershell
npm --prefix server run import:jobs -- --dry-run "C:\path\to\indian-job-market-dataset-2025.xlsx"
npm --prefix server run import:jobs -- "C:\path\to\indian-job-market-dataset-2025.xlsx"
```

The import command uses the server's existing `MONGODB_URI`; do not place credentials in command arguments or source files. It creates a unique dataset/job ID index and a dataset/normalized-skill index.

Each recommendation's match percentage is `70% × skill match + 20% × experience compatibility + 10% × location relevance`. Skill match is the share of the job's listed tags present among detected resume skills after conservative alias normalization. Experience compatibility compares explicit years found in detected resume experience text with the job's minimum years; when either value is unavailable, that component is neutral (50%). Location is a case-insensitive text match between the user's saved profile location and the listed job location; when either is unavailable, that component is neutral (50%). This is deterministic matching, not an AI-generated score.

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