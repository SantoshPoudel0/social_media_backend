const express = require('express');
const multer = require('multer');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }
    // Handle file filter errors
    if (err.message === 'Only image files are allowed!') {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// Protected routes
router.post(
  '/image',
  authMiddleware,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  uploadController.uploadImage
);

router.delete('/image', authMiddleware, uploadController.deleteImage);

module.exports = router;