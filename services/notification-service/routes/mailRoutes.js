import express from 'express';
import {
  sendApprovalStatusEmail,
  sendOrderDeliveredEmail,
  sendRefundEmail,
  sendPaymentConfirmationEmail
} from '../services/mailService.js';

const router = express.Router();

router.post('/send-approval-status', async (req, res, next) => {
  try {
    const { to, fullName, accountType, status, reason } = req.body;
    await sendApprovalStatusEmail({ to, fullName, accountType, status, reason });
    return res.json({ success: true, message: 'Approval email sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/send-order-delivered', async (req, res, next) => {
  try {
    const { to, customerName, orderId, restaurantName } = req.body;
    await sendOrderDeliveredEmail({ to, customerName, orderId, restaurantName });
    return res.json({ success: true, message: 'Delivered email sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/send-refund', async (req, res, next) => {
  try {
    const { to, customerName, orderId, refundAmount, gatewayName, status } = req.body;
    await sendRefundEmail({ to, customerName, orderId, refundAmount, gatewayName, status });
    return res.json({ success: true, message: 'Refund email sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/send-payment-confirmation', async (req, res, next) => {
  try {
    const { to, customerName, orderId, amount, currency } = req.body;
    await sendPaymentConfirmationEmail({ to, customerName, orderId, amount, currency });
    return res.json({ success: true, message: 'Payment confirmation email sent' });
  } catch (error) {
    next(error);
  }
});

export default router;
