const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadController = {
  // Upload image to Cloudinary
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'social-media-app',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      });

      // Delete local file after upload
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (unlinkError) {
        console.error('Error deleting local file:', unlinkError);
      }

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: result.secure_url,
        publicId: result.public_id
      });
    } catch (error) {
      console.error('Upload image error:', error);
      
      // Delete local file if upload fails
      if (req.file && req.file.path) {
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (unlinkError) {
          console.error('Error deleting local file after failed upload:', unlinkError);
        }
      }

      // Provide more detailed error message
      let errorMessage = 'Server error during image upload';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.http_code) {
        errorMessage = `Cloudinary error: ${error.message || 'Upload failed'}`;
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Delete image from Cloudinary
  deleteImage: async (req, res) => {
    try {
      const { publicId } = req.body;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Public ID is required'
        });
      }

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        res.json({
          success: true,
          message: 'Image deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during image deletion'
      });
    }
  }
};

module.exports = uploadController;