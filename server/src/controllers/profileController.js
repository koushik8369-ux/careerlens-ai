import { createProfileService } from '../services/profileService.js';

export function createProfileController({ profileService = createProfileService() } = {}) {
  return {
    async getProfile(request, response, next) {
      try {
        return response.status(200).json(await profileService.getProfile(request.user));
      } catch (error) {
        return next(error);
      }
    },

    async updateProfile(request, response, next) {
      try {
        return response.status(200).json(
          await profileService.updateProfile(request.user, request.body),
        );
      } catch (error) {
        return next(error);
      }
    },
  };
}