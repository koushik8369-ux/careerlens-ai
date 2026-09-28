import { createDashboardService } from '../services/dashboardService.js';

export function createDashboardController({ dashboardService = createDashboardService() } = {}) {
  return {
    async getDashboard(request, response, next) {
      try {
        return response.status(200).json(await dashboardService.getDashboard(request.user));
      } catch (error) {
        return next(error);
      }
    },
  };
}