import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRATION_MS = 86_400_000;
const ALLOWED_ROLES = new Set(['USER', 'ADMIN']);

export function getJwtConfiguration(env = process.env) {
  const secret = env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 UTF-8 bytes.');
  }

  const expirationMs = Number(env.JWT_EXPIRATION ?? DEFAULT_EXPIRATION_MS);
  if (!Number.isSafeInteger(expirationMs) || expirationMs <= 0) {
    throw new Error('JWT_EXPIRATION must be a positive integer in milliseconds.');
  }

  return { secret, expiresInSeconds: Math.ceil(expirationMs / 1000) };
}

export function validateJwtConfiguration(env = process.env) {
  getJwtConfiguration(env);
}

export function generateToken(email, role, env = process.env) {
  const { secret, expiresInSeconds } = getJwtConfiguration(env);
  return jwt.sign(
    { role },
    secret,
    {
      algorithm: 'HS256',
      subject: email,
      expiresIn: expiresInSeconds,
    },
  );
}

export function extractAuthentication(token, env = process.env) {
  const { secret } = getJwtConfiguration(env);
  const claims = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (typeof claims === 'string'
      || typeof claims.sub !== 'string'
      || !ALLOWED_ROLES.has(claims.role)) {
    throw new Error('Invalid authentication token.');
  }
  return { email: claims.sub, role: claims.role };
}