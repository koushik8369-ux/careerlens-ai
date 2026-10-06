import { createJobRecommendationService } from '../services/jobRecommendationService.js';

export function createJobRecommendationController({
  service = createJobRecommendationService(),
} = {}) {
  return {
    async recommended(request, response, next) {
      try {
        const result = await service.getRecommendedJobs(request.user, request.query);
        return response.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },
  };
}
