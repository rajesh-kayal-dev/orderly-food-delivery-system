import express from 'express';
const router = express.Router();

import { protect } from '../middleware/authMiddleware.js';
import { createVNPayPayment,
  vnpayReturn,
  vnpayIpn, } from '../controllers/paymentController.js';

// Create payment session for VNPay. Does NOT create order yet.
router.post('/create-vnpay', protect, createVNPayPayment);

// VNPay browser return
router.get('/vnpay/return', vnpayReturn);

// VNPay server callback (IPN)
router.get('/vnpay/ipn', vnpayIpn);

export default router;
