const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password
      });

      await user.save();

      // Generate JWT token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          bio: user.bio,
          followers: user.followers,
          following: user.following
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          bio: user.bio,
          followers: user.followers,
          following: user.following
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  },

  // Get current user
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate('followers', 'username profilePicture')
        .populate('following', 'username profilePicture');

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { username, bio, profilePicture } = req.body;
      const userId = req.user._id;

      // Validate username if provided
      if (username) {
        // Check username format
        if (username.length < 3 || username.length > 30) {
          return res.status(400).json({
            success: false,
            message: 'Username must be between 3 and 30 characters'
          });
        }
        
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
          return res.status(400).json({
            success: false,
            message: 'Username must start with a letter and can only contain letters, numbers, and underscores'
          });
        }
        
        // Prevent usernames that end with more than 4 consecutive digits
        if (/\d{5,}$/.test(username)) {
          return res.status(400).json({
            success: false,
            message: 'Username cannot end with more than 4 consecutive digits'
          });
        }
        
        // Prevent usernames that are mostly numbers
        const letterCount = (username.match(/[a-zA-Z]/g) || []).length;
        if (letterCount < 2 && username.length > 5) {
          return res.status(400).json({
            success: false,
            message: 'Username must contain at least 2 letters'
          });
        }
        
        // Check if username is already taken
        const existingUser = await User.findOne({ 
          username, 
          _id: { $ne: userId } 
        });
        
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken'
          });
        }
      }

      const updateData = {};
      if (username) updateData.username = username;
      if (bio !== undefined) updateData.bio = bio;
      if (profilePicture) updateData.profilePicture = profilePicture;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during profile update'
      });
    }
  }
};

module.exports = authController;