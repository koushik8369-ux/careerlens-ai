import { createJobIntelligenceService } from '../services/jobIntelligenceService.js';

export function createJobIntelligenceController({ service = createJobIntelligenceService() } = {}) {
  return {
    async analyze(request, response, next) {
      try {
        return response.status(200).json(await service.analyzeJob(request.user, request.body));
      } catch (error) {
        return next(error);
      }
    },
    async history(request, response, next) {
      try {
        return response.status(200).json(await service.getHistory(request.user));
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
  };
}