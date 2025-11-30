const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');

const commentController = {
  // Create new comment
  createComment: async (req, res) => {
    try {
      const { content } = req.body;
      const postId = req.params.postId;

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Create comment
      const comment = new Comment({
        content,
        author: req.user._id,
        post: postId
      });

      await comment.save();
      await comment.populate('author', 'username profilePicture');

      // Add comment to post's comments array
      await Post.findByIdAndUpdate(postId, {
        $push: { comments: comment._id }
      });

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        comment
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during comment creation'
      });
    }
  },

  // Get comments for a post
  getCommentsByPost: async (req, res) => {
    try {
      const postId = req.params.postId;
      
      const comments = await Comment.find({ post: postId })
        .populate('author', 'username profilePicture')
        .populate('likes', 'username profilePicture')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        comments
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching comments'
      });
    }
  },

  // Update comment
  updateComment: async (req, res) => {
    try {
      const { content } = req.body;
      const commentId = req.params.commentId;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user is the author
      if (comment.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this comment'
        });
      }

      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true, runValidators: true }
      ).populate('author', 'username profilePicture');

      res.json({
        success: true,
        message: 'Comment updated successfully',
        comment: updatedComment
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during comment update'
      });
    }
  },

  // Delete comment
  deleteComment: async (req, res) => {
    try {
      const commentId = req.params.commentId;
      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user is the author
      if (comment.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this comment'
        });
      }

      // Remove comment from post's comments array
      await Post.findByIdAndUpdate(comment.post, {
        $pull: { comments: commentId }
      });

      // Delete the comment
      await Comment.findByIdAndDelete(commentId);

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during comment deletion'
      });
    }
  },

  // Toggle like on comment
  toggleLikeComment: async (req, res) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.user._id;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const isLiked = comment.likes.includes(userId);
      
      if (isLiked) {
        // Unlike the comment
        await Comment.findByIdAndUpdate(commentId, {
          $pull: { likes: userId }
        });
      } else {
        // Like the comment
        await Comment.findByIdAndUpdate(commentId, {
          $push: { likes: userId }
        });
      }

      const updatedComment = await Comment.findById(commentId)
        .populate('author', 'username profilePicture')
        .populate('likes', 'username profilePicture');

      res.json({
        success: true,
        message: isLiked ? 'Comment unliked' : 'Comment liked',
        comment: updatedComment,
        isLiked: !isLiked
      });
    } catch (error) {
      console.error('Toggle like comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during comment like operation'
      });
    }
  }
};

module.exports = commentController;