import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { captureRawBody } from '../middleware/rawBody.js';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPayment,
  getPaymentStatus
} from '../controllers/paymentController.js';

const router = express.Router();

// POST /api/payments/create-order — requires auth
router.post('/create-order', protect, createOrder);

// POST /api/payments/verify — requires auth
router.post('/verify', protect, verifyPayment);

/**
 * POST /api/payments/webhook
 * NO auth middleware — Razorpay sends this directly.
 * Uses captureRawBody instead of express.json() to allow HMAC signature verification.
 */
router.post('/webhook', captureRawBody, handleWebhook);

// GET /api/payments/:orderId — requires auth
router.get('/:orderId', protect, getPayment);

// GET /api/payments/:orderId/status — requires auth
router.get('/:orderId/status', protect, getPaymentStatus);

export default router;
