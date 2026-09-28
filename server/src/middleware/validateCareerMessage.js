import { body, validationResult } from 'express-validator';

function validateMessage(request, _response, next) {
  const result = validationResult(request);
  if (result.isEmpty()) return next();
  const errors = result.array();
  const error = new Error(errors[0].msg);
  error.status = 400;
  error.errors = Object.fromEntries(errors.map(({ path, msg }) => [path, msg]));
  return next(error);
}

export const validateCareerMessage = [
  body('question')
    .isString().withMessage('Question must not be blank').bail()
    .trim()
    .notEmpty().withMessage('Question must not be blank').bail()
    .isLength({ max: 2000 }).withMessage('Question must not exceed 2000 characters'),
  validateMessage,
];