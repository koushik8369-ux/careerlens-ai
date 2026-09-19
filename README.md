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

The backend resolves the authenticated user from the security context and builds provider input from structured, user-owned career data. The APIs do not require a frontend-supplied `userId`.

## Future and Planned Features

- External LLM provider integration. The current implementation uses the deterministic provider; API keys in the environment example are placeholders only.
- Additional AI provider implementations can be added behind the existing `CareerAiProvider` contract.

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
```

The backend loads these values from `backend/.env` or environment variables. Do not commit `.env` or place real credentials in source control. CORS is configured for the local frontend at `http://localhost:5173`.

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
