import { createCareerPlanService } from '../services/careerPlanService.js';

export function createCareerPlanController({ service = createCareerPlanService() } = {}) {
  return {
    async generate(request, response, next) {
      try {
        return response.status(200).json(await service.generate(request.user));
      } catch (error) {
        return next(error);
      }
    },
    async current(request, response, next) {
      try {
        return response.status(200).json(await service.getCurrent(request.user));
      } catch (error) {
        return next(error);
      }
    },
    async getById(request, response, next) {
      try {
        return response.status(200).json(await service.getById(request.user, request.params.id));
      } catch (error) {
        return next(error);
      }
    },
    async updateItem(request, response, next) {
      try {
        return response.status(200).json(await service.updateItem(
          request.user,
          request.params.id,
          request.params.itemId,
          request.body,
        ));
      } catch (error) {
        return next(error);
      }
    },
  };
}