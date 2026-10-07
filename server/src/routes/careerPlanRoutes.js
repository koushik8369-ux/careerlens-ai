import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { createCareerPlanController } from '../controllers/careerPlanController.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { createCareerPlanService } from '../services/careerPlanService.js';

const validatePlanItemUpdate = [
  body().custom((value) => (
    (typeof value?.completed === 'boolean')
    || ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(value?.status)
  )).withMessage('Provide a valid completed flag or item status'),
  (request, _response, next) => {
    const result = validationResult(request);
    if (result.isEmpty()) return next();
    const error = new Error(result.array()[0].msg);
    error.status = 400;
    error.errors = Object.fromEntries(result.array().map(({ path, msg }) => [path, msg]));
    return next(error);
  },
];

export function createCareerPlanRoutes(dependencies = {}) {
  const router = Router();
  const controller = createCareerPlanController({
    service: createCareerPlanService(dependencies),
  });
  router.use(createAuthMiddleware(dependencies));
  router.post('/', controller.generate);
  router.get('/current', controller.current);
  router.get('/:id', controller.getById);
  router.patch('/:id/items/:itemId', validatePlanItemUpdate, controller.updateItem);
  return router;
}