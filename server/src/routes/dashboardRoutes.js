import { Router } from 'express';
import { createDashboardController } from '../controllers/dashboardController.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { createDashboardService } from '../services/dashboardService.js';

export function createDashboardRoutes(dependencies = {}) {
  const router = Router();
  const controller = createDashboardController({
    dashboardService: createDashboardService(dependencies),
  });

  router.use(createAuthMiddleware(dependencies));
  router.get('/', controller.getDashboard);

  return router;
}