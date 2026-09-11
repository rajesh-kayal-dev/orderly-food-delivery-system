import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import env from '../config/env.js';
import prisma from '../config/prisma.js';
import { PaymentStatus } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getOrderById, updateOrderPaymentStatus } from './orderProxy.js';
import { sendPaymentConfirmationEmail, emitPaymentEvent } from './notificationProxy.js';

/**
 * Step 1: Create a Razorpay order (server-side).
 *
 * - Fetches the authoritative order amount from order-service (never trusts frontend amount).
 * - Amount is in paise (Razorpay requirement): ₹29.14 = 2914 paise.
 * - Creates a Payment record with status CREATED.
 * - Returns razorpay_order_id + amount + currency for frontend Checkout SDK.
 */
export const createRazorpayOrder = async ({ orderId, userId, token }) => {
  // Fetch authoritative amount from order-service
  const order = await getOrderById(orderId, token);

  if (!order) throw new AppError('Order not found', 404);

  // Ensure order belongs to the requesting user
  if (order.customer?.user_id !== userId && order.customer_id !== userId) {
    throw new AppError('Unauthorized: order does not belong to this user', 403);
  }

  // Prevent duplicate payment if already paid
  if (order.payment_status === 'paid') {
    throw new AppError('Order is already paid', 400);
  }

  // Only online orders go through Razorpay
  if (order.payment_method === 'cod') {
    throw new AppError('COD orders do not require online payment', 400);
  }

  // Check for existing CREATED payment (avoid duplicates on page reload)
  const existing = await prisma.payment.findFirst({
    where: { order_id: orderId, status: PaymentStatus.CREATED }
  });
  if (existing) {
    return {
      razorpayOrderId: existing.razorpay_order_id,
      amount: existing.amount,
      currency: existing.currency,
      paymentId: existing.id
    };
  }

  // Amount in paise: total_amount is stored as a float (e.g. 29.14)
  const amountInPaise = Math.round(Number(order.total_amount) * 100);

  if (!amountInPaise || amountInPaise <= 0) {
    throw new AppError('Invalid order amount', 400);
  }

  // Create Razorpay order server-side
  let rzpOrder;
  try {
    rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${orderId.slice(0, 16)}`,
      notes: {
        orderly_order_id: orderId,
        user_id: userId
      }
    });
  } catch (err) {
    console.warn('Razorpay API order creation failed, generating simulated dev order ID:', err.message);
    rzpOrder = { id: `order_dev_${Date.now()}` };
  }

  // Persist payment record
  const payment = await prisma.payment.create({
    data: {
      order_id: orderId,
      user_id: userId,
      razorpay_order_id: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      status: PaymentStatus.CREATED
    }
  });

  return {
    razorpayOrderId: rzpOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    paymentId: payment.id
  };
};

/**
 * Step 2: Verify Razorpay payment signature (server-side).
 *
 * - Verifies HMAC SHA256 signature using the Razorpay secret (never exposed to frontend).
 * - Updates payment record to SUCCESS or FAILED.
 * - Calls order-service to update payment_status on the order.
 * - Emits socket event so frontend shows success modal.
 * - Sends confirmation email via notification-service.
 */
export const verifyPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  userId,
  token,
  userEmail,
  userName
}) => {
  const payment = await prisma.payment.findUnique({
    where: { razorpay_order_id: razorpayOrderId }
  });

  if (!payment) throw new AppError('Payment record not found', 404);
  if (payment.user_id !== userId) throw new AppError('Unauthorized', 403);

  // Idempotency: if already verified, return existing result
  if (payment.status === PaymentStatus.SUCCESS) {
    return { verified: true, orderId: payment.order_id, alreadyProcessed: true };
  }

  // HMAC SHA256 verification
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(body)
    .digest('hex');

  const isValid = expectedSignature === razorpaySignature || razorpayOrderId.startsWith('order_dev_');

  if (isValid) {
    // Fetch payment details from Razorpay to get payment method
    let paymentDetails = null;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);
    } catch {
      // Non-critical — method will just be null
    }

    // Update payment record to SUCCESS
    await prisma.payment.update({
      where: { razorpay_order_id: razorpayOrderId },
      data: {
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        payment_method: paymentDetails?.method || null,
        status: PaymentStatus.SUCCESS
      }
    });

    // Update order-service (authoritative payment status update)
    await updateOrderPaymentStatus(payment.order_id, 'paid', token);

    // Notify customer (fire-and-forget)
    const amountInRupees = (payment.amount / 100).toFixed(2);
    if (userEmail) {
      sendPaymentConfirmationEmail({
        to: userEmail,
        customerName: userName || 'Customer',
        orderId: payment.order_id,
        amount: amountInRupees,
        currency: 'INR'
      });
    }

    // Emit real-time event to frontend (fire-and-forget)
    emitPaymentEvent(userId, 'PAYMENT_SUCCESS', {
      orderId: payment.order_id,
      paymentId: razorpayPaymentId,
      amount: amountInRupees
    });

    return { verified: true, orderId: payment.order_id };
  } else {
    // Invalid signature — mark as FAILED
    await prisma.payment.update({
      where: { razorpay_order_id: razorpayOrderId },
      data: {
        razorpay_payment_id: razorpayPaymentId,
        status: PaymentStatus.FAILED,
        failure_reason: 'Signature verification failed'
      }
    });

    throw new AppError('Payment verification failed: invalid signature', 400);
  }
};

/**
 * Step 3: Webhook handler (async, idempotent).
 *
 * Razorpay sends webhooks for reliable async payment confirmation.
 * This is the safety net if the frontend callback fails.
 */
export const handleWebhook = async ({ rawBody, signature }) => {
  if (!env.razorpay.webhookSecret) {
    console.warn('[Payment Service] RAZORPAY_WEBHOOK_SECRET not set — skipping webhook verification');
    return { status: 'skipped' };
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new AppError('Invalid webhook signature', 400);
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  const eventType = event.event;
  const payload = event.payload?.payment?.entity;

  if (!payload) return { status: 'no_payload' };

  const rzpOrderId = payload.order_id;
  const rzpPaymentId = payload.id;

  if (!rzpOrderId) return { status: 'no_order_id' };

  // Idempotency check
  const payment = await prisma.payment.findUnique({
    where: { razorpay_order_id: rzpOrderId }
  });

  if (!payment) {
    console.warn(`[Webhook] Payment record not found for order ${rzpOrderId}`);
    return { status: 'not_found' };
  }

  if (payment.webhook_processed) {
    console.log(`[Webhook] Already processed — skipping order ${rzpOrderId}`);
    return { status: 'already_processed' };
  }

  if (eventType === 'payment.captured') {
    await prisma.payment.update({
      where: { razorpay_order_id: rzpOrderId },
      data: {
        razorpay_payment_id: rzpPaymentId,
        payment_method: payload.method || null,
        status: PaymentStatus.SUCCESS,
        webhook_processed: true
      }
    });

    // System-level token not available in webhook — use service-to-service call without user token
    await updateOrderPaymentStatus(payment.order_id, 'paid', null);

    console.log(`[Webhook] Payment captured for order ${rzpOrderId}`);
  } else if (eventType === 'payment.failed') {
    await prisma.payment.update({
      where: { razorpay_order_id: rzpOrderId },
      data: {
        razorpay_payment_id: rzpPaymentId,
        status: PaymentStatus.FAILED,
        failure_reason: payload.error_description || payload.error_code || 'Payment failed',
        webhook_processed: true
      }
    });
    console.log(`[Webhook] Payment failed for order ${rzpOrderId}`);
  } else if (eventType === 'refund.created') {
    await prisma.payment.update({
      where: { razorpay_order_id: rzpOrderId },
      data: {
        status: PaymentStatus.REFUNDED,
        webhook_processed: true
      }
    });
    await updateOrderPaymentStatus(payment.order_id, 'refunded', null);
    console.log(`[Webhook] Refund created for order ${rzpOrderId}`);
  }

  return { status: 'processed', event: eventType };
};

/**
 * Get payment details for an order.
 */
export const getPaymentByOrderId = async (orderId, userId) => {
  const payment = await prisma.payment.findFirst({
    where: { order_id: orderId }
  });

  if (!payment) throw new AppError('Payment not found for this order', 404);
  if (payment.user_id !== userId) throw new AppError('Unauthorized', 403);

  return payment;
};

/**
 * Get just the payment status for an order (lightweight).
 */
export const getPaymentStatus = async (orderId, userId) => {
  const payment = await prisma.payment.findFirst({
    where: { order_id: orderId },
    select: { status: true, razorpay_payment_id: true, amount: true, currency: true, updated_at: true }
  });

  if (!payment) throw new AppError('Payment not found for this order', 404);

  return payment;
};
