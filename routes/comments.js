const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');
const {
  commentValidation,
  handleValidationErrors
} = require('../middleware/validation');

// Public routes
router.get('/post/:postId', commentController.getCommentsByPost);

// Protected routes
router.post(
  '/post/:postId',
  authMiddleware,
  commentValidation,
  handleValidationErrors,
  commentController.createComment
);

router.put(
  '/:commentId',
  authMiddleware,
  commentValidation,
  handleValidationErrors,
  commentController.updateComment
);

router.delete('/:commentId', authMiddleware, commentController.deleteComment);
router.post('/:commentId/like', authMiddleware, commentController.toggleLikeComment);

module.exports = router;