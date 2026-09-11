import express from 'express';
const router = express.Router();
import { getMyProfile, updateMyProfile } from '../controllers/deliveryPartnerController.js';
import { protect } from '../middleware/authMiddleware.js';

// All routes require authentication
router.use(protect);

// GET  /api/delivery-partner/my-profile  → fetch own profile
router.get('/my-profile', getMyProfile);

// PUT  /api/delivery-partner/my-profile  → update profile fields (is_available, etc.)
router.put('/my-profile', updateMyProfile);

export default router;
