import { createCareerAssistantService } from '../services/careerAssistantService.js';

export function createCareerAssistantController({ service = createCareerAssistantService() } = {}) {
  return {
    async createConversation(request, response, next) {
      try {
        return response.status(201).json(await service.createConversation(request.user));
      } catch (error) {
        return next(error);
      }
    },
    async getConversations(request, response, next) {
      try {
        return response.status(200).json(await service.getConversations(request.user));
      } catch (error) {
        return next(error);
      }
    },
    async getMessages(request, response, next) {
      try {
        return response.status(200).json(await service.getMessages(request.user, request.params.conversationId));
      } catch (error) {
        return next(error);
      }
    },
    async sendMessage(request, response, next) {
      try {
        return response.status(200).json(await service.sendMessage(
          request.user,
          request.params.conversationId,
          request.body.question,
        ));
      } catch (error) {
        return next(error);
      }
    },
    async actionPlan(request, response, next) {
      try {
        return response.status(200).json(await service.generateActionPlan(request.user));
      } catch (error) {
        return next(error);
      }
    },
    async resumeImprovement(request, response, next) {
      try {
        return response.status(200).json(await service.improveResume(request.user));
      } catch (error) {
        return next(error);
      }
    },
    async roadmap(request, response, next) {
      try {
        return response.status(200).json(await service.generateRoadmap(request.user));
      } catch (error) {
        return next(error);
      }
    },
    async projects(request, response, next) {
      try {
        return response.status(200).json(await service.recommendProjects(request.user));
      } catch (error) {
        return next(error);
      }
    },
    async interviewPreparation(request, response, next) {
      try {
        return response.status(200).json(await service.prepareForInterview(request.user));
      } catch (error) {
        return next(error);
      }
    },
    async interviewAnswerFeedback(request, response, next) {
      try {
        return response.status(200).json(await service.evaluateInterviewAnswer(request.user, request.body));
      } catch (error) {
        return next(error);
      }
    },
  };
}