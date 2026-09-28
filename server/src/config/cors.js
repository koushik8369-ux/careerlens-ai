export function getAllowedOrigins(env = process.env) {
  const configured = env.CORS_ALLOWED_ORIGINS?.trim();
  const origins = (configured || (env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error('CORS_ALLOWED_ORIGINS must contain explicit origins in production.');
  }
  if (origins.includes('*')) {
    throw new Error('Wildcard CORS origins are not allowed.');
  }

  return origins;
}

export function createCorsOptions(env = process.env) {
  const allowedOrigins = getAllowedOrigins(env);
  return {
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  };
}