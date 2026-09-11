import axios from 'axios';
import env from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const ORDER_SERVICE = env.services.order;

/**
 * Fetches order details from the order-service (server-to-server).
 * Used to validate the amount before creating a Razorpay order — never trust the frontend amount.
 */
export const getOrderById = async (orderId, token) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE}/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Gateway-Request': 'true',
        'X-Service-Name': 'payment-service'
      },
      timeout: 10000
    });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new AppError('Order not found', 404);
    }
    throw new AppError('Failed to fetch order details from order-service', 502);
  }
};

/**
 * Updates payment_status on the order in order-service after successful payment verification.
 * This is the authoritative payment update — not triggered by the frontend.
 */
export const updateOrderPaymentStatus = async (orderId, paymentStatus, token) => {
  try {
    await axios.put(
      `${ORDER_SERVICE}/api/orders/${orderId}/payment-status`,
      { payment_status: paymentStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Gateway-Request': 'true',
          'X-Service-Name': 'payment-service'
        },
        timeout: 10000
      }
    );
  } catch (error) {
    // Log but don't throw — payment is already recorded, order update is best-effort
    console.error(`[OrderProxy] Failed to update order ${orderId} payment_status:`, error.message);
  }
};
