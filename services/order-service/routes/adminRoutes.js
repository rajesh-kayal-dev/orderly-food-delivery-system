import express from 'express';
import { getAllOrders } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/orders', getAllOrders);

export default router;
