const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');

const postController = {
  // Create new post
  createPost: async (req, res) => {
    try {
      const { content, image, tags } = req.body;
      
      const post = new Post({
        content,
        image: image || '',
        author: req.user._id,
        tags: tags || []
      });

      await post.save();
      await post.populate('author', 'username profilePicture');

      // Add post to user's posts array
      await User.findByIdAndUpdate(req.user._id, {
        $push: { posts: post._id }
      });

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        post
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during post creation'
      });
    }
  },

  // Get all posts (feed)
  getAllPosts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const posts = await Post.find()
        .populate('author', 'username profilePicture')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username profilePicture'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPosts = await Post.countDocuments();

      res.json({
        success: true,
        posts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts
      });
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching posts',
        posts: [] // Return empty array on error
      });
    }
  },

  // Get single post
  getPostById: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id)
        .populate('author', 'username profilePicture')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username profilePicture'
          }
        });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      res.json({
        success: true,
        post
      });
    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching post'
      });
    }
  },

  // Get posts by user
  getPostsByUser: async (req, res) => {
    try {
      const posts = await Post.find({ author: req.params.userId })
        .populate('author', 'username profilePicture')
        .populate('comments')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        posts
      });
    } catch (error) {
      console.error('Get user posts error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching user posts'
      });
    }
  },

  // Update post
  updatePost: async (req, res) => {
    try {
      const { content, image, tags } = req.body;
      const postId = req.params.id;

      const post = await Post.findById(postId);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Check if user is the author
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this post'
        });
      }

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          content: content || post.content,
          image: image || post.image,
          tags: tags || post.tags
        },
        { new: true, runValidators: true }
      ).populate('author', 'username profilePicture');

      res.json({
        success: true,
        message: 'Post updated successfully',
        post: updatedPost
      });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during post update'
      });
    }
  },

  // Delete post
  deletePost: async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Check if user is the author
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this post'
        });
      }

      // Delete all comments associated with the post
      await Comment.deleteMany({ post: postId });

      // Remove post from user's posts array
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { posts: postId }
      });

      // Delete the post
      await Post.findByIdAndDelete(postId);

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during post deletion'
      });
    }
  },

  // Like/unlike post
  toggleLike: async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user._id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      const isLiked = post.likes.includes(userId);
      
      if (isLiked) {
        // Unlike the post
        await Post.findByIdAndUpdate(postId, {
          $pull: { likes: userId }
        });
        await User.findByIdAndUpdate(userId, {
          $pull: { likedPosts: postId }
        });
      } else {
        // Like the post
        await Post.findByIdAndUpdate(postId, {
          $push: { likes: userId }
        });
        await User.findByIdAndUpdate(userId, {
          $push: { likedPosts: postId }
        });
      }

      const updatedPost = await Post.findById(postId)
        .populate('author', 'username profilePicture');

      res.json({
        success: true,
        message: isLiked ? 'Post unliked' : 'Post liked',
        post: updatedPost,
        isLiked: !isLiked
      });
    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during like operation'
      });
    }
  }
};

module.exports = postController;