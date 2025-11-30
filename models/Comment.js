const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Virtual for likes count
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Ensure virtual fields are serialized
commentSchema.set('toJSON', {
  virtuals: true
});

commentSchema.set('toObject', {
  virtuals: true
});

module.exports = mongoose.model('Comment', commentSchema);