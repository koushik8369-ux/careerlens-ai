import cors from 'cors';
import express from 'express';
import { createCorsOptions } from './config/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createDashboardRoutes } from './routes/dashboardRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { createProfileRoutes } from './routes/profileRoutes.js';
import { createResumeRoutes } from './routes/resumeRoutes.js';
import { createJobIntelligenceRoutes } from './routes/jobIntelligenceRoutes.js';
import { createCareerAssistantRoutes } from './routes/careerAssistantRoutes.js';
import { createCareerPlanRoutes } from './routes/careerPlanRoutes.js';
import { createJobRoutes } from './routes/jobRoutes.js';

export function createApp({
	authDependencies,
	resumeDependencies = authDependencies,
	jobDependencies = authDependencies,
	jobRecommendationDependencies = authDependencies,
	careerDependencies = authDependencies,
} = {}) {
	const app = express();

	app.use(cors(createCorsOptions()));
	app.use(express.json({ limit: '1mb' }));
	app.use('/api', healthRoutes);
	app.use('/api/auth', createAuthRoutes(authDependencies));
	app.use('/api/profile', createProfileRoutes(authDependencies));
	app.use('/api/dashboard', createDashboardRoutes(authDependencies));
	app.use('/api/resume', createResumeRoutes(resumeDependencies));
	app.use('/api/job-intelligence', createJobIntelligenceRoutes(jobDependencies));
	app.use('/api/jobs', createJobRoutes(jobRecommendationDependencies));
	app.use('/api/career-assistant', createCareerAssistantRoutes(careerDependencies));
	app.use('/api/career-plans', createCareerPlanRoutes(careerDependencies));
	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}

const app = createApp();

export default app;