const User = require('../models/User');
const Post = require('../models/Post');

const userController = {
  // Get user profile
  getUserProfile: async (req, res) => {
    try {
      const username = req.params.username;
      const user = await User.findOne({ username })
        .populate('followers', 'username profilePicture')
        .populate('following', 'username profilePicture')
        .populate('posts');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user's posts
      const posts = await Post.find({ author: user._id })
        .populate('author', 'username profilePicture')
        .populate('comments')
        .sort({ createdAt: -1 });

      // Check if current user is following this user
      const isFollowing = req.user ? 
        user.followers.includes(req.user._id) : false;

      res.json({
        success: true,
        user: {
          ...user.toObject(),
          posts
        },
        isFollowing
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching user profile'
      });
    }
  },

  // Search users
  searchUsers: async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.json({
          success: true,
          users: []
        });
      }

      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
        .select('username profilePicture bio')
        .limit(10);

      res.json({
        success: true,
        users
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while searching users'
      });
    }
  },

  // Follow user
  followUser: async (req, res) => {
    try {
      const userToFollowId = req.params.userId;
      const currentUserId = req.user._id;

      // Check if user is trying to follow themselves
      if (userToFollowId === currentUserId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot follow yourself'
        });
      }

      // Check if user exists
      const userToFollow = await User.findById(userToFollowId);
      if (!userToFollow) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if already following
      const isAlreadyFollowing = await User.findOne({
        _id: currentUserId,
        following: userToFollowId
      });

      if (isAlreadyFollowing) {
        return res.status(400).json({
          success: false,
          message: 'You are already following this user'
        });
      }

      // Add to current user's following list
      await User.findByIdAndUpdate(currentUserId, {
        $push: { following: userToFollowId }
      });

      // Add to target user's followers list
      await User.findByIdAndUpdate(userToFollowId, {
        $push: { followers: currentUserId }
      });

      const updatedUser = await User.findById(userToFollowId)
        .populate('followers', 'username profilePicture')
        .populate('following', 'username profilePicture');

      res.json({
        success: true,
        message: 'User followed successfully',
        user: updatedUser,
        isFollowing: true
      });
    } catch (error) {
      console.error('Follow user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during follow operation'
      });
    }
  },

  // Unfollow user
  unfollowUser: async (req, res) => {
    try {
      const userToUnfollowId = req.params.userId;
      const currentUserId = req.user._id;

      // Check if user exists
      const userToUnfollow = await User.findById(userToUnfollowId);
      if (!userToUnfollow) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if actually following
      const isFollowing = await User.findOne({
        _id: currentUserId,
        following: userToUnfollowId
      });

      if (!isFollowing) {
        return res.status(400).json({
          success: false,
          message: 'You are not following this user'
        });
      }

      // Remove from current user's following list
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: userToUnfollowId }
      });

      // Remove from target user's followers list
      await User.findByIdAndUpdate(userToUnfollowId, {
        $pull: { followers: currentUserId }
      });

      const updatedUser = await User.findById(userToUnfollowId)
        .populate('followers', 'username profilePicture')
        .populate('following', 'username profilePicture');

      res.json({
        success: true,
        message: 'User unfollowed successfully',
        user: updatedUser,
        isFollowing: false
      });
    } catch (error) {
      console.error('Unfollow user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during unfollow operation'
      });
    }
  },

  // Get follow suggestions (users not followed by current user)
  getFollowSuggestions: async (req, res) => {
    try {
      const currentUserId = req.user._id;
      const limit = parseInt(req.query.limit) || 5;

      // Get users that the current user is not following
      const currentUser = await User.findById(currentUserId);
      const followingIds = currentUser.following;
      
      // Exclude current user and users already being followed
      const suggestions = await User.find({
        _id: { $nin: [...followingIds, currentUserId] }
      })
        .select('username profilePicture bio')
        .limit(limit);

      res.json({
        success: true,
        suggestions
      });
    } catch (error) {
      console.error('Get follow suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching follow suggestions'
      });
    }
  }
};

module.exports = userController;