# CareerLens AI

CareerLens AI is a Smart Career Intelligence Platform for analyzing career profiles, resumes, job requirements, skill gaps, and career development actions.

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Java 21
- Spring Boot 3.3.4
- Apache Maven
- Spring Data JPA
- Apache Tika for document text extraction

### Data and Security

- MySQL for runtime persistence
- Spring Security
- BCrypt password hashing
- JWT authentication with stateless protected APIs
- H2 in-memory database for backend tests

### Testing

- JUnit
- Mockito
- Spring Boot Test
- Spring MockMvc

## Implemented Features

- Authentication: registration, login, BCrypt password hashing, JWT authentication, and protected APIs
- User profile and dashboard
- Resume Analyzer with file upload, structured analysis, and history
- Job and Career Intelligence with job analysis and history
- Career Assistant conversations and chat
- Career Plan generation, retrieval, and task completion
- Resume Improvement API
- Skill Roadmap API
- Project Recommendations API
- Interview Preparation API
- Career Action Plan API
- Deterministic AI provider architecture for repeatable career guidance without an external LLM dependency
- Optional OpenAI-compatible LLM provider with validated local configuration and opt-in smoke testing

The backend resolves the authenticated user from the security context and builds provider input from structured, user-owned career data. The APIs do not require a frontend-supplied `userId`.

## Provider Modes

The deterministic provider is the default and requires no external AI service. An optional OpenAI-compatible LLM provider can be enabled with `AI_PROVIDER=llm`. The provider must expose `/chat/completions`; keep `LLM_API_KEY` only in environment variables or an ignored local `.env` file.

## Backend API

All endpoints require JWT authentication unless marked **Public**. The backend runs under `/api`.

| Area | Method | Endpoint | Access |
| --- | --- | --- | --- |
| Health | GET | `/api/health` | Public |
| Authentication | POST | `/api/auth/register` | Public |
| Authentication | POST | `/api/auth/login` | Public |
| Authentication | GET | `/api/auth/me` | Authenticated |
| Profile | GET | `/api/profile` | Authenticated |
| Profile | PUT | `/api/profile` | Authenticated |
| Dashboard | GET | `/api/dashboard` | Authenticated |
| Resume Analyzer | POST | `/api/resume/analyze` | Authenticated |
| Resume Analyzer | GET | `/api/resume/history` | Authenticated |
| Resume Analyzer | GET | `/api/resume/{id}` | Authenticated |
| Job Intelligence | POST | `/api/job-intelligence/analyze` | Authenticated |
| Job Intelligence | GET | `/api/job-intelligence/history` | Authenticated |
| Job Intelligence | GET | `/api/job-intelligence/{id}` | Authenticated |
| Career Conversations | POST | `/api/career-assistant/conversations` | Authenticated |
| Career Conversations | GET | `/api/career-assistant/conversations` | Authenticated |
| Career Conversations | GET | `/api/career-assistant/conversations/{conversationId}/messages` | Authenticated |
| Career Conversations | POST | `/api/career-assistant/conversations/{conversationId}/messages` | Authenticated |
| Resume Improvement | POST | `/api/career-assistant/resume-improvement` | Authenticated |
| Skill Roadmap | POST | `/api/career-assistant/roadmap` | Authenticated |
| Project Recommendations | POST | `/api/career-assistant/projects` | Authenticated |
| Interview Preparation | POST | `/api/career-assistant/interview-preparation` | Authenticated |
| Career Action Plan | POST | `/api/career-assistant/action-plan` | Authenticated |
| Career Plan | POST | `/api/career-plans` | Authenticated |
| Career Plan | GET | `/api/career-plans/current` | Authenticated |
| Career Plan | GET | `/api/career-plans/{id}` | Authenticated |
| Career Plan | PATCH | `/api/career-plans/{id}/items/{itemId}` | Authenticated |

## Project Structure

```text
careerlens-ai/
├── backend/
│   ├── src/main/java/com/careerlens/
│   │   ├── config/       # Security, CORS, and application configuration
│   │   ├── controller/   # REST controllers
│   │   ├── dto/          # Request and response types
│   │   ├── entity/       # JPA entities
│   │   ├── exception/    # API exception handling
│   │   ├── repository/   # Spring Data repositories
│   │   ├── security/     # JWT services and authentication filter
│   │   └── service/      # Application and domain services
│   ├── src/main/resources/application.properties
│   ├── src/test/java/com/careerlens/
│   ├── src/test/resources/application.properties
│   ├── .env.example
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- JDK 21
- Apache Maven 3.8 or newer
- Node.js and npm
- MySQL 8 or a compatible MySQL server

### MySQL and Backend Configuration

Create or make available a MySQL database for CareerLens. The default JDBC URL creates `careerlens_db` when the MySQL user has permission to do so.

From `backend/`, copy `.env.example` to `.env` and set values appropriate for the local environment:

```properties
DB_URL=jdbc:mysql://localhost:3306/careerlens_db
DB_USERNAME=<mysql-username>
DB_PASSWORD=<mysql-password>
JWT_SECRET=<at-least-32-byte-secret>
JWT_EXPIRATION=86400000
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

The backend loads these values from `backend/.env` or environment variables. Do not commit `.env` or place real credentials in source control. Local development allows `http://localhost:5173` by default; production must set `CORS_ALLOWED_ORIGINS` to explicit frontend origin(s).

### Local AI Provider Configuration

The backend uses deterministic career guidance by default, so it starts without LLM credentials:

```properties
AI_PROVIDER=deterministic
```

To use a real OpenAI-compatible provider locally, set `AI_PROVIDER=llm` and provide these values in `backend/.env` or the process environment:

```properties
LLM_API_KEY=<provider-key>
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
LLM_TIMEOUT=30s
```

`LLM_BASE_URL` must point to a provider exposing an OpenAI-compatible `/chat/completions` endpoint. The LLM provider validates the key, base URL, model, and positive timeout during startup. Keep API keys only in `.env` or environment variables; never commit or print them. The equivalent Spring properties are `app.ai.provider` and `app.ai.llm.*`.

### Production Configuration

Start the backend with the production profile after supplying `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, and `CORS_ALLOWED_ORIGINS` through the deployment environment or secret manager:

```powershell
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

The production profile validates the existing schema, disables SQL and formatted SQL logging, uses INFO-level application logging, preserves the multipart limits, and requires explicit CORS origins. It does not create or update database schema automatically; apply compatible schema changes separately.

### Production Database Bootstrap

Production uses `spring.jpa.hibernate.ddl-auto=validate`, so a compatible MySQL schema must exist before the backend starts. The deterministic bootstrap schema is [backend/src/main/resources/db/schema.sql](backend/src/main/resources/db/schema.sql). Run it against an empty production database with the MySQL client:

```powershell
mysql -u <username> -p <database_name> < backend/src/main/resources/db/schema.sql
```

Local development continues to use the existing `ddl-auto=update` configuration and does not require this bootstrap step.

### Run the Backend

```powershell
cd backend
mvn spring-boot:run
```

The backend is available at `http://localhost:8080`. The public health check is:

```text
GET http://localhost:8080/api/health
```

### Run the Frontend

From `frontend/`, copy `.env.example` to `.env` if needed and set the API base URL:

```properties
VITE_API_BASE_URL=http://localhost:8080/api
```

Then install dependencies and start Vite:

```powershell
cd frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:5173`.

## Testing

Run backend tests from `backend/`:

```powershell
mvn clean test
```

Normal tests are completely offline. An optional real-provider smoke test is skipped unless explicitly enabled and all LLM environment variables are present:

```powershell
$env:CAREERLENS_LLM_SMOKE_TEST="true"
mvn test
```

The smoke test makes one real chat request, verifies that the response maps to `CareerAssistantAnswer`, and reports only safe generic diagnostics. Unset `CAREERLENS_LLM_SMOKE_TEST` after the check. A Maven property can also enable it with `mvn -Dllm.smoke.test=true test`.

Build the frontend from `frontend/`:

```powershell
npm run build
```

## Development Progress

- Phase 1 - Authentication: **Complete**
- Phase 2 - Profile and Dashboard: **Complete**
- Phase 3 - Resume Analyzer: **Complete**
- Phase 4 - Job and Career Intelligence: **Complete**
- Phase 5 - Career AI foundation and Career Assistant: **Complete**
