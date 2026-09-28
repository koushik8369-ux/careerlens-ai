import User from '../models/User.js';

const TOTAL_COMPLETION_FIELDS = 9;

function createNotFoundError() {
  const error = new Error('Authenticated user was not found');
  error.status = 404;
  return error;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function createDashboardService({ userModel = User } = {}) {
  return {
    async getDashboard(authenticatedUser) {
      const user = await userModel.findById(authenticatedUser.id);
      if (!user) {
        throw createNotFoundError();
      }

      const profile = user.profile;
      const completedFields = [
        hasText(user.fullName),
        hasText(user.email),
        hasText(profile?.education),
        hasText(profile?.college),
        profile?.graduationYear != null,
        hasText(profile?.careerGoal),
        Array.isArray(profile?.skills) && profile.skills.length > 0,
        hasText(profile?.bio),
        hasText(profile?.location),
      ].filter(Boolean).length;
      const profileCompletionPercentage = profile
        ? Math.floor(completedFields * 100 / TOTAL_COMPLETION_FIELDS)
        : 0;

      return {
        userId: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        careerGoal: profile?.careerGoal ?? null,
        education: profile?.education ?? null,
        profileCompletionPercentage,
        skillCount: profile?.skills?.length ?? 0,
        profileStatus: profileCompletionPercentage === 100
          ? 'COMPLETE'
          : profileCompletionPercentage === 0 ? 'NOT_STARTED' : 'IN_PROGRESS',
      };
    },
  };
}