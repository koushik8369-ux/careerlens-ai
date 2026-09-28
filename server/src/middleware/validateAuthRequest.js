import { body, validationResult } from 'express-validator';

const registrationRules = [
  body('fullName')
    .isString().withMessage('Full name is required').bail()
    .trim()
    .notEmpty().withMessage('Full name is required'),
  body('email')
    .isString().withMessage('Email is required').bail()
    .trim()
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Email must be a valid email address'),
  body('password')
    .isString().withMessage('Password is required').bail()
    .custom((password) => password.trim().length > 0).withMessage('Password is required').bail()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .isString().withMessage('Confirm password is required').bail()
    .custom((password) => password.trim().length > 0).withMessage('Confirm password is required').bail()
    .custom((password, { req }) => password === req.body.password)
    .withMessage('Passwords do not match'),
];

const loginRules = [
  body('email')
    .isString().withMessage('Email is required').bail()
    .trim()
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Email must be a valid email address'),
  body('password')
    .isString().withMessage('Password is required').bail()
    .custom((password) => password.trim().length > 0).withMessage('Password is required'),
];

function validateRequest(request, _response, next) {
  const validation = validationResult(request);
  if (validation.isEmpty()) {
    return next();
  }

  const validationErrors = validation.array();
  const error = new Error(validationErrors[0].msg);
  error.status = 400;
  error.errors = Object.fromEntries(validationErrors.map(({ path, msg }) => [path, msg]));
  return next(error);
}

export const validateRegistration = [...registrationRules, validateRequest];
export const validateLogin = [...loginRules, validateRequest];