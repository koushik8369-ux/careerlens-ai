import { Router } from 'express';
import { createJobIntelligenceController } from '../controllers/jobIntelligenceController.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { validateJobAnalysis } from '../middleware/validateJobRequest.js';
import { createJobIntelligenceService } from '../services/jobIntelligenceService.js';

export function createJobIntelligenceRoutes(dependencies = {}) {
  const router = Router();
  const controller = createJobIntelligenceController({
    service: createJobIntelligenceService(dependencies),
  });
  router.use(createAuthMiddleware(dependencies));
  router.post('/analyze', validateJobAnalysis, controller.analyze);
  router.get('/history', controller.history);
  router.get('/:id', controller.getById);
  return router;
}