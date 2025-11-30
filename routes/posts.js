const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');
const { postValidation, handleValidationErrors } = require('../middleware/validation');

// Public routes
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.get('/user/:userId', postController.getPostsByUser);

// Protected routes
router.post(
  '/',
  authMiddleware,
  postValidation,
  handleValidationErrors,
  postController.createPost
);

router.put(
  '/:id',
  authMiddleware,
  postValidation,
  handleValidationErrors,
  postController.updatePost
);

router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:id/like', authMiddleware, postController.toggleLike);

module.exports = router;