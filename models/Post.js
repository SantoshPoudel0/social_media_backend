const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  image: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  },
  comments: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    default: []
  },
  tags: {
    type: [{
      type: String,
      trim: true
    }],
    default: []
  }
}, {
  timestamps: true
});

// Pre-save hook to ensure arrays are always initialized
postSchema.pre('save', function(next) {
  if (!this.likes) {
    this.likes = [];
  }
  if (!this.comments) {
    this.comments = [];
  }
  if (!this.tags) {
    this.tags = [];
  }
  next();
});

// Virtual for likes count
postSchema.virtual('likesCount').get(function() {
  return this.likes && Array.isArray(this.likes) ? this.likes.length : 0;
});

// Virtual for comments count
postSchema.virtual('commentsCount').get(function() {
  return this.comments && Array.isArray(this.comments) ? this.comments.length : 0;
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', {
  virtuals: true
});

postSchema.set('toObject', {
  virtuals: true
});

module.exports = mongoose.model('Post', postSchema);