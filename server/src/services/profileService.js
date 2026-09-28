import User from '../models/User.js';

const PROFILE_FIELDS = [
  'phone',
  'education',
  'college',
  'graduationYear',
  'careerGoal',
  'bio',
  'location',
  'skills',
];

function createNotFoundError(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

function normalizeText(value) {
  if (value == null || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  return [...new Set(skills
    .map(normalizeText)
    .filter((skill) => skill !== null))];
}

function toProfileResponse(user) {
  const profile = user.profile;
  return {
    userId: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: profile.phone,
    education: profile.education,
    college: profile.college,
    graduationYear: profile.graduationYear,
    careerGoal: profile.careerGoal,
    bio: profile.bio,
    location: profile.location,
    skills: [...profile.skills],
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function createProfileService({ userModel = User } = {}) {
  async function findAuthenticatedUser(authenticatedUser) {
    const user = await userModel.findById(authenticatedUser.id);
    if (!user) {
      throw createNotFoundError('Authenticated user was not found');
    }
    return user;
  }

  return {
    async getProfile(authenticatedUser) {
      const user = await findAuthenticatedUser(authenticatedUser);
      if (!user.profile) {
        throw createNotFoundError('User profile not found');
      }
      return toProfileResponse(user);
    },

    async updateProfile(authenticatedUser, request) {
      const user = await findAuthenticatedUser(authenticatedUser);
      const now = new Date();
      const createdAt = user.profile?.createdAt ?? now;
      const profile = {};

      for (const field of PROFILE_FIELDS) {
        profile[field] = field === 'skills'
          ? normalizeSkills(request[field])
          : field === 'graduationYear' ? request[field] ?? null : normalizeText(request[field]);
      }

      user.profile = { ...profile, createdAt, updatedAt: now };
      await user.save();
      return toProfileResponse(user);
    },
  };
}