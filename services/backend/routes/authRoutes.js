import express from 'express';
const router = express.Router();
import { registerUser, loginUser, getProfile, updateProfile, getApprovedDeliveryPartners } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/approved-partners', getApprovedDeliveryPartners);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
