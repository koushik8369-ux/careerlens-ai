import { Router } from 'express';
import { createResumeController } from '../controllers/resumeController.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';
import { createResumeAnalysisService } from '../services/resumeAnalysisService.js';

export function createResumeRoutes(dependencies = {}) {
  const router = Router();
  const controller = createResumeController({
    resumeService: createResumeAnalysisService(dependencies),
  });

  router.use(createAuthMiddleware(dependencies));
  router.post('/analyze', uploadResume, controller.analyze);
  router.get('/history', controller.getHistory);
  router.get('/:id', controller.getById);

  return router;
}