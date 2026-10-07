import { Router } from 'express';
import { createCareerAssistantController } from '../controllers/careerAssistantController.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { validateCareerMessage } from '../middleware/validateCareerMessage.js';
import { createCareerAssistantService } from '../services/careerAssistantService.js';

export function createCareerAssistantRoutes(dependencies = {}) {
  const router = Router();
  const controller = createCareerAssistantController({
    service: createCareerAssistantService(dependencies),
  });
  router.use(createAuthMiddleware(dependencies));
  router.post('/conversations', controller.createConversation);
  router.get('/conversations', controller.getConversations);
  router.get('/conversations/:conversationId/messages', controller.getMessages);
  router.post('/conversations/:conversationId/messages', validateCareerMessage, controller.sendMessage);
  router.post('/action-plan', controller.actionPlan);
  router.post('/resume-improvement', controller.resumeImprovement);
  router.post('/roadmap', controller.roadmap);
  router.post('/projects', controller.projects);
  router.post('/interview-preparation', controller.interviewPreparation);
  router.post('/interview-preparation/feedback', controller.interviewAnswerFeedback);
  return router;
}