import { query, validationResult } from 'express-validator';

function createValidationError(errors) {
  const error = new Error(errors[0].msg);
  error.status = 400;
  error.errors = Object.fromEntries(errors.map(({ path, msg }) => [path, msg]));
  return error;
}

function validateFields(request, _response, next) {
  const result = validationResult(request);
  if (!result.isEmpty()) return next(createValidationError(result.array()));
  return next();
}

export const validateJobRecommendationRequest = [
  query('resumeAnalysisId')
    .isMongoId().withMessage('A valid resume analysis ID is required.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 25 }).withMessage('Limit must be between 1 and 25.')
    .toInt(),
  validateFields,
];
