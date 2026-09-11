import * as paymentService from '../services/paymentService.js';

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order server-side.
 * Returns razorpay_order_id, amount (paise), currency for the frontend SDK.
 */
export const createOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const result = await paymentService.createRazorpayOrder({
      orderId,
      userId: req.user.id,
      token: req.headers.authorization?.split(' ')[1]
    });

    return res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: result.razorpayOrderId,
        amount: result.amount,
        currency: result.currency,
        paymentId: result.paymentId,
        keyId: process.env.RAZORPAY_KEY_ID  // only the KEY ID is sent to frontend, never the secret
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature server-side.
 * Only marks order as paid if HMAC signature is valid.
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required'
      });
    }

    const result = await paymentService.verifyPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      userId: req.user.id,
      token: req.headers.authorization?.split(' ')[1],
      userEmail: req.user.email,
      userName: req.user.full_name || req.user.name
    });

    return res.status(200).json({
      success: true,
      data: {
        verified: result.verified,
        orderId: result.orderId,
        alreadyProcessed: result.alreadyProcessed || false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/webhook
 * Razorpay async webhook — processes events idempotently using raw body HMAC verification.
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay webhook signature' });
    }

    const result = await paymentService.handleWebhook({
      rawBody: req.rawBody,
      signature
    });

    // Always return 200 to Razorpay — retry logic is their responsibility
    return res.status(200).json({ success: true, status: result.status });
  } catch (error) {
    // Return 400 for bad signature to stop Razorpay retrying with a bad payload
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * GET /api/payments/:orderId
 * Returns full payment details for an order.
 */
export const getPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const payment = await paymentService.getPaymentByOrderId(orderId, req.user.id);
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/:orderId/status
 * Returns just the payment status (lightweight, for polling).
 */
export const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const status = await paymentService.getPaymentStatus(orderId, req.user.id);
    return res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};
