import { body, validationResult } from 'express-validator';

function validateJobRequest(request, _response, next) {
  const result = validationResult(request);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array();
  const error = new Error(errors[0].msg);
  error.status = 400;
  error.errors = Object.fromEntries(errors.map(({ path, msg }) => [path, msg]));
  return next(error);
}

export const validateJobAnalysis = [
  body().custom((value) => value !== null && typeof value === 'object' && !Array.isArray(value))
    .withMessage('Request body must be a JSON object'),
  body('jobTitle').optional({ nullable: true }).isString().withMessage('jobTitle must be a string'),
  body('companyName').optional({ nullable: true }).isString().withMessage('companyName must be a string'),
  body('jobDescription')
    .isString().withMessage('Job description cannot be blank').bail()
    .custom((value) => value.trim().length > 0).withMessage('Job description cannot be blank').bail()
    .isLength({ min: 30, max: 20000 })
    .withMessage('Job description must be between 30 and 20,000 characters'),
  validateJobRequest,
];