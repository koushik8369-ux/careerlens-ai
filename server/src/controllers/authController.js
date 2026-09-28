import { createAuthService } from '../services/authService.js';
import { toSafeUser } from '../utils/userResponse.js';

export function createAuthController({ authService = createAuthService() } = {}) {
  return {
    async register(request, response, next) {
      try {
        const user = await authService.register(request.body);
        return response.status(201).json(toSafeUser(user));
      } catch (error) {
        return next(error);
      }
    },

    async login(request, response, next) {
      try {
        const { user, token } = await authService.login(request.body);
        return response.status(200).json({
          ...toSafeUser(user),
          message: 'Login successful',
          token,
        });
      } catch (error) {
        return next(error);
      }
    },

    currentUser(request, response) {
      return response.status(200).json(request.user);
    },
  };
}