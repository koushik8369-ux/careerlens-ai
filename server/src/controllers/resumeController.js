import { createResumeAnalysisService } from '../services/resumeAnalysisService.js';

export function createResumeController({ resumeService = createResumeAnalysisService() } = {}) {
  return {
    async analyze(request, response, next) {
      try {
        const result = await resumeService.analyzeResume(
          request.user,
          request.file,
          request.body?.targetRole,
        );
        return response.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    async getHistory(request, response, next) {
      try {
        return response.status(200).json(await resumeService.getHistory(request.user));
      } catch (error) {
        return next(error);
      }
    },

    async getById(request, response, next) {
      try {
        return response.status(200).json(await resumeService.getById(request.user, request.params.id));
      } catch (error) {
        return next(error);
      }
    },
  };
}