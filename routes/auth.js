const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  handleValidationErrors
} = require('../middleware/validation');

// Public routes
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  authController.register
);

router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  authController.login
);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;