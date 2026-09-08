# CareerLens AI — Smart Career Intelligence Platform

CareerLens AI is a Smart Career Intelligence Platform designed to help students and aspiring professionals analyze their technical and soft skills, identify critical industry skill gaps, track roadmap milestones, and receive personalized career recommendations.

> **Note**: This repository contains the scalable architectural foundation and initial skeleton. Premature features such as authentication, database persistence, resume parsing, and AI inference will be introduced incrementally in subsequent phases.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (with Glassmorphic Theme)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Iconography**: Lucide React

### Backend
- **Language**: Java 21 (LTS)
- **Framework**: Spring Boot 3.3.4
- **Build Tool**: Apache Maven
- **Architecture**: Decoupled Layered Architecture (Controller, Service, Repository, Entity, DTO, Security, Exception)
- **CORS**: Configured for `http://localhost:5173`

---

## 📁 Project Structure

```
careerlens-ai/
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/               # Static assets & media
│   │   ├── components/
│   │   │   ├── common/           # Generic shared UI widgets
│   │   │   ├── layout/           # AppLayout, Navbar, Footer
│   │   │   └── ui/               # Atomic design UI elements
│   │   ├── context/              # Global React contexts
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Route pages (Home, Dashboard, About, NotFound)
│   │   ├── services/             # Axios API service clients
│   │   ├── types/                # TypeScript interfaces & definitions
│   │   ├── utils/                # Helper functions & utility methods
│   │   ├── App.tsx               # Route declarations & main application wrapper
│   │   ├── index.css             # Tailwind base & custom design system tokens
│   │   └── main.tsx              # Application DOM entrypoint
│   ├── .env.example
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── careerlens/
│   │   │   │           ├── CareerLensApplication.java  # Spring Boot Main Entry
│   │   │   │           ├── config/                     # Web & CORS configuration
│   │   │   │           ├── controller/                 # REST API Controllers
│   │   │   │           ├── dto/                        # Data Transfer Objects
│   │   │   │           ├── entity/                     # Domain Entities
│   │   │   │           ├── exception/                  # Global Exception Handlers
│   │   │   │           ├── repository/                 # Data Repositories
│   │   │   │           ├── security/                   # Security & Auth filters
│   │   │   │           └── service/                    # Business Logic Layer
│   │   │   └── resources/
│   │   │       └── application.properties              # Port & runtime configs
│   │   └── test/
│   │       └── java/
│   │           └── com/
│   │               └── careerlens/                     # Unit & Integration Tests
│   ├── .env.example
│   └── pom.xml
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: `v18+` (v20+ recommended)
- **Java**: `JDK 21` (LTS)
- **Apache Maven**: `3.8+`

---

### 1. Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy environment variables (optional for foundation):
   ```bash
   cp .env.example .env
   ```
3. Build and test the project:
   ```bash
   mvn clean test
   ```
4. Start the Spring Boot backend server:
   ```bash
   mvn spring-boot:run
   ```
   The backend will be live at: **`http://localhost:8080`**

5. Verify health endpoint:
   ```bash
   curl http://localhost:8080/api/health
   ```
   *Expected Response:*
   ```json
   {
     "status": "CareerLens AI backend is running"
   }
   ```

---

### 2. Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will be live at: **`http://localhost:5173`**

5. Build for production:
   ```bash
   npm run build
   ```

---

## 🧭 Routes & Navigation

| Route | Page Component | Description |
| :--- | :--- | :--- |
| `/` | `HomePage` | Platform overview, value propositions & live backend connectivity ping |
| `/dashboard` | `DashboardPage` | Career readiness indicators & roadmap placeholder |
| `/about` | `AboutPage` | Platform mission, design principles, and technical architecture |
| `*` | `NotFoundPage` | 404 handler with fallback navigation to Home |

---

## 🔒 Security & CORS Policy
- Backend CORS is configured in `com.careerlens.config.CorsConfig` to allow requests originating from `http://localhost:5173`.
- No database or authentication credentials are hardcoded.
