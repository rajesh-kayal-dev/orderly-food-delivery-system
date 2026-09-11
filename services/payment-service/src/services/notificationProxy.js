import axios from 'axios';
import env from '../config/env.js';

const NOTIFICATION_SERVICE = env.services.notification;

/**
 * Sends a payment confirmation email via notification-service.
 * Fire-and-forget — errors are logged, not propagated.
 */
export const sendPaymentConfirmationEmail = async ({ to, customerName, orderId, amount, currency }) => {
  try {
    await axios.post(
      `${NOTIFICATION_SERVICE}/api/notifications/mail/send-payment-confirmation`,
      { to, customerName, orderId, amount, currency },
      { timeout: 8000 }
    );
    console.log(`[NotificationProxy] Payment confirmation email sent to ${to}`);
  } catch (error) {
    console.error(`[NotificationProxy] Email error:`, error.message);
  }
};

/**
 * Emits a real-time socket event to the customer's room via notification-service.
 * Used to trigger the Order Success Modal on the frontend.
 */
export const emitPaymentEvent = async (userId, event, data) => {
  try {
    await axios.post(
      `${NOTIFICATION_SERVICE}/api/notifications/realtime/emit`,
      { room: userId, event, data },
      { timeout: 5000 }
    );
    console.log(`[NotificationProxy] Event '${event}' emitted to user ${userId}`);
  } catch (error) {
    console.error(`[NotificationProxy] Socket emit error:`, error.message);
  }
};
