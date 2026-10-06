import { Router } from 'express';
import { createJobRecommendationController } from '../controllers/jobRecommendationController.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { validateJobRecommendationRequest } from '../middleware/validateJobRecommendationRequest.js';
import { createJobRecommendationService } from '../services/jobRecommendationService.js';

export function createJobRoutes(dependencies = {}) {
  const router = Router();
  const controller = createJobRecommendationController({
    service: createJobRecommendationService(dependencies),
  });

  router.use(createAuthMiddleware(dependencies));
  router.get('/recommended', validateJobRecommendationRequest, controller.recommended);
  return router;
}
