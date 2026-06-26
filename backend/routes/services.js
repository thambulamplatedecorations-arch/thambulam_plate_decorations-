const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Service = require('../models/Service');
const { protect, admin } = require('../middleware/authMiddleware');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // limit file size to 5MB
});

// Stream upload function to send buffer to Cloudinary
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'thambulam_services',
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.write(fileBuffer);
    stream.end();
  });
};

// @desc    Get all plate decoration services
// @route   GET /api/services
// @access  Public
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({}).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Upload a new service plate image & create service
// @route   POST /api/services
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Please provide a title' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload an image file' });
  }

  try {
    // Upload image buffer to Cloudinary
    const result = await streamUpload(req.file.buffer);

    // Create service entry in database
    const service = new Service({
      title,
      description: description || '',
      imageUrl: result.secure_url,
    });

    const createdService = await service.save();
    res.status(201).json(createdService);
  } catch (error) {
    console.error('Cloudinary/DB upload error:', error);
    res.status(500).json({ message: 'Service creation failed' });
  }
});

// Helper to extract Cloudinary Public ID from URL
const extractPublicId = (imageUrl) => {
  const parts = imageUrl.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  const afterUpload = parts.slice(uploadIndex + 1);
  const hasVersion = afterUpload[0] && afterUpload[0].startsWith('v');
  const pathParts = hasVersion ? afterUpload.slice(1) : afterUpload;
  const pathWithExtension = pathParts.join('/');
  const lastDot = pathWithExtension.lastIndexOf('.');
  return lastDot === -1 ? pathWithExtension : pathWithExtension.substring(0, lastDot);
};

// @desc    Delete multiple plate services (Admin only)
// @route   DELETE /api/services
// @access  Private/Admin
router.delete('/', protect, admin, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Please provide an array of service IDs to delete' });
  }

  try {
    const services = await Service.find({ _id: { $in: ids } });
    
    for (const service of services) {
      if (service.imageUrl) {
        const publicId = extractPublicId(service.imageUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    await Service.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${ids.length} service design(s) deleted successfully` });
  } catch (error) {
    console.error('Error deleting services:', error);
    res.status(500).json({ message: 'Failed to delete selected service designs' });
  }
});

// @desc    Delete single plate service (Admin only)
// @route   DELETE /api/services/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service design not found' });
    }

    if (service.imageUrl) {
      const publicId = extractPublicId(service.imageUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service design deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Failed to delete service design' });
  }
});

module.exports = router;
