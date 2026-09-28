import { body, validationResult } from 'express-validator';

function createValidationError(errors) {
  const error = new Error(errors[0].msg);
  error.status = 400;
  error.errors = Object.fromEntries(errors.map(({ path, msg }) => [path, msg]));
  return error;
}

function requireJsonObject(request, _response, next) {
  if (request.body === null || typeof request.body !== 'object' || Array.isArray(request.body)) {
    const error = new Error('Request body must be a JSON object');
    error.status = 400;
    error.errors = { body: error.message };
    return next(error);
  }
  return next();
}

const optionalTextFields = [
  ['phone', 30, 'Phone must be at most 30 characters'],
  ['education', 120, 'Education must be at most 120 characters'],
  ['college', 160, 'College must be at most 160 characters'],
  ['careerGoal', 160, 'Career goal must be at most 160 characters'],
  ['bio', 2000, 'Bio must be at most 2000 characters'],
  ['location', 120, 'Location must be at most 120 characters'],
];

const fieldRules = optionalTextFields.flatMap(([field, maxLength, message]) => [
  body(field).optional({ nullable: true }).isString().withMessage(`${field} must be a string`).bail(),
  body(field).optional({ nullable: true }).isLength({ max: maxLength }).withMessage(message),
]);

fieldRules.push(
  body('graduationYear')
    .optional({ nullable: true })
    .isInt({ min: 1900, max: 2200 }).withMessage('Graduation year must be valid')
    .toInt(),
  body('skills')
    .optional({ nullable: true })
    .isArray().withMessage('Skills must be an array').bail()
    .isArray({ max: 50 }).withMessage('A maximum of 50 skills is allowed').bail()
    .custom((skills) => skills.every((skill) => skill == null || typeof skill === 'string'))
    .withMessage('Skills must contain only strings').bail()
    .custom((skills) => skills.every((skill) => skill == null || skill.length <= 80))
    .withMessage('Skill must be at most 80 characters'),
);

function validateFields(request, _response, next) {
  const result = validationResult(request);
  if (!result.isEmpty()) {
    return next(createValidationError(result.array()));
  }
  return next();
}

export const validateProfileRequest = [requireJsonObject, ...fieldRules, validateFields];