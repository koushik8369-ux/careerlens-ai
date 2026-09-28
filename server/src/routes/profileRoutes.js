import { Router } from 'express';
import { createProfileController } from '../controllers/profileController.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { validateProfileRequest } from '../middleware/validateProfileRequest.js';
import { createProfileService } from '../services/profileService.js';

export function createProfileRoutes(dependencies = {}) {
  const router = Router();
  const controller = createProfileController({
    profileService: createProfileService(dependencies),
  });

  router.use(createAuthMiddleware(dependencies));
  router.get('/', controller.getProfile);
  router.put('/', validateProfileRequest, controller.updateProfile);

  return router;
}