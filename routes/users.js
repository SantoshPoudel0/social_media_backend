const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/search', userController.searchUsers);
router.get('/profile/:username', userController.getUserProfile);

// Protected routes
router.post('/:userId/follow', authMiddleware, userController.followUser);
router.delete('/:userId/follow', authMiddleware, userController.unfollowUser);
router.get('/suggestions', authMiddleware, userController.getFollowSuggestions);

module.exports = router;