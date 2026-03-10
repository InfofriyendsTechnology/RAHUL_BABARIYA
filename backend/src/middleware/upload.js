import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import responseHandler from '../utils/responseHandler.js';

// Use memory storage — stream directly to Cloudinary (no disk writes)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WebP images allowed.'), false);
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

// Upload buffer to Cloudinary
export const uploadToCloudinary = (buffer, folder = 'rahul-babariya') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', format: 'webp', quality: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return responseHandler.error(res, 'File too large. Max 10MB.');
    }
    return responseHandler.error(res, err.message);
  }
  if (err) return responseHandler.error(res, err.message);
  next();
};
