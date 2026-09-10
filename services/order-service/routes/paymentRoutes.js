import express from 'express';
import { createPaymentUrl, handleVnPayReturn } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/vnpay/create-url', protect, createPaymentUrl);
router.get('/vnpay/vnpay_return', handleVnPayReturn);

export default router;
