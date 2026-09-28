export function notFoundHandler(_request, response, next) {
  const error = new Error('Route not found.');
  error.status = 404;
  next(error);
}

export function errorHandler(error, _request, response, _next) {
  const candidateStatus = error.status ?? error.statusCode;
  const status = Number.isInteger(candidateStatus)
      && ((candidateStatus >= 400 && candidateStatus < 500) || candidateStatus === 503)
    ? candidateStatus
    : 500;
  const message = error.type === 'entity.parse.failed'
    ? 'Malformed JSON request.'
    : status === 500 ? 'An unexpected internal error occurred.' : error.message;

  const errorResponse = {
    message,
    status,
    timestamp: new Date().toISOString(),
  };
  if (status === 400 && error.errors) {
    errorResponse.errors = error.errors;
  }

  response.status(status).json(errorResponse);
}