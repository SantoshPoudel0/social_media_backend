const { body, validationResult } = require('express-validator');

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z][a-zA-Z0-9_]*$/)
    .withMessage('Username must start with a letter and can only contain letters, numbers, and underscores')
    .custom((value) => {
      // Prevent usernames that end with more than 4 consecutive digits
      if (/\d{5,}$/.test(value)) {
        throw new Error('Username cannot end with more than 4 consecutive digits');
      }
      // Prevent usernames that are mostly numbers
      const letterCount = (value.match(/[a-zA-Z]/g) || []).length;
      if (letterCount < 2 && value.length > 5) {
        throw new Error('Username must contain at least 2 letters');
      }
      return true;
    }),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const postValidation = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Post content must be between 1 and 1000 characters')
];

const commentValidation = [
  body('content')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  postValidation,
  commentValidation,
  handleValidationErrors
};