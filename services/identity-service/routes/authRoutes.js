import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  googleAuthRedirect,
  googleAuthCallback,
  googleLogin,
  getApprovedDeliveryPartners
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/approved-partners', getApprovedDeliveryPartners);

// Google OAuth routes
router.get('/google', googleAuthRedirect);
router.get('/google/callback', googleAuthCallback);
router.post('/google', googleLogin);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
