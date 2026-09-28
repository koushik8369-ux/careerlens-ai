import User from '../models/User.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

function createAuthError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isDuplicateEmailError(error) {
  return error?.code === 11000
    && (error.keyPattern?.email || error.keyValue?.email || error.message?.includes('email_1'));
}

export function createAuthService({
  userModel = User,
  hash = hashPassword,
  compare = comparePassword,
  createToken = generateToken,
} = {}) {
  return {
    async register({ fullName, email, password }) {
      const normalizedEmail = email.trim().toLowerCase();
      if (await userModel.exists({ email: normalizedEmail })) {
        throw createAuthError('Email already registered', 409);
      }

      const passwordHash = await hash(password);
      try {
        return await userModel.create({
          fullName: fullName.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'USER',
        });
      } catch (error) {
        if (isDuplicateEmailError(error)) {
          throw createAuthError('Email already registered', 409);
        }
        throw error;
      }
    },

    async login({ email, password }) {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await userModel.findOne({ email: normalizedEmail }).select('+passwordHash');
      if (!user || !(await compare(password, user.passwordHash))) {
        throw createAuthError('Invalid email or password', 401);
      }

      return {
        user,
        token: createToken(user.email, user.role),
      };
    },
  };
}