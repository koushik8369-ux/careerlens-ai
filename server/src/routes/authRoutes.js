import { Router } from 'express';
import { createAuthController } from '../controllers/authController.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { validateLogin, validateRegistration } from '../middleware/validateAuthRequest.js';
import { createAuthService } from '../services/authService.js';

export function createAuthRoutes(dependencies = {}) {
  const router = Router();
  const authService = dependencies.authService ?? createAuthService(dependencies);
  const authController = createAuthController({ authService });
  const requireAuthentication = createAuthMiddleware(dependencies);

  router.post('/register', validateRegistration, authController.register);
  router.post('/login', validateLogin, authController.login);
  router.get('/me', requireAuthentication, authController.currentUser);

  return router;
}