import cors from 'cors';
import express from 'express';
import { createCorsOptions } from './config/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

export function createApp({ authDependencies } = {}) {
	const app = express();

	app.use(cors(createCorsOptions()));
	app.use(express.json({ limit: '1mb' }));
	app.use('/api', healthRoutes);
	app.use('/api/auth', createAuthRoutes(authDependencies));
	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}

const app = createApp();

export default app;