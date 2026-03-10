import { Router } from 'express';
import { adminLogin }                        from '../controllers/authController.js';
import { getPortfolio, updatePortfolio, uploadImage } from '../controllers/portfolioController.js';
import authMiddleware                        from '../middleware/auth.js';
import { upload, handleUploadError }         from '../middleware/upload.js';

const router = Router();

// Auth
router.post('/auth/login', adminLogin);

// Portfolio — public read
router.get('/portfolio', getPortfolio);

// Portfolio — admin write
router.put('/portfolio',              authMiddleware, updatePortfolio);
router.post('/portfolio/upload-image', authMiddleware, upload.single('image'), handleUploadError, uploadImage);

export default router;
