import User from '../models/User.js';
import { extractAuthentication } from '../utils/jwt.js';
import { toSafeUser } from '../utils/userResponse.js';

function unauthorized(message) {
  const error = new Error(message);
  error.status = 401;
  return error;
}

export function createAuthMiddleware({
  userModel = User,
  authenticateToken = extractAuthentication,
} = {}) {
  return async (request, _response, next) => {
    const authorization = request.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return next(unauthorized('Authentication required.'));
    }

    let identity;
    try {
      identity = authenticateToken(authorization.slice(7));
    } catch {
      return next(unauthorized('Invalid or expired authentication token.'));
    }

    try {
      const user = await userModel.findOne({ email: identity.email });
      if (!user) {
        return next(unauthorized('Invalid or expired authentication token.'));
      }
      request.user = toSafeUser(user);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}