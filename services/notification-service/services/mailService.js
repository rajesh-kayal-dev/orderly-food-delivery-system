import nodemailer from 'nodemailer';
import env from '../config/env.js';
import {
  getDeliveredEmailTemplate,
  getRefundEmailTemplate,
  getApprovalStatusTemplate
} from '../mailTemplates.js';
import { AppError } from '../middleware/errorHandler.js';

const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: env.mail.secure,
  auth: {
    user: env.mail.user,
    pass: env.mail.pass
  }
});

export const sendMail = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    throw new AppError('Recipient (to), subject, and html content are required', 400);
  }

  return await transporter.sendMail({
    from: env.mail.from,
    to,
    subject,
    html
  });
};

export const sendApprovalStatusEmail = async ({ to, fullName, accountType, status, reason }) => {
  const normalizedStatus = String(status || '').toUpperCase();
  const isApproved = normalizedStatus === 'APPROVED';
  const roleLabel = accountType === 'restaurant' ? 'restaurant' : 'driver';

  const subject = isApproved
    ? `Your ${roleLabel} account has been approved`
    : `Account approval update`;

  const html = getApprovalStatusTemplate({ fullName, accountType, status, reason });
  return await sendMail({ to, subject, html });
};

export const sendOrderDeliveredEmail = async ({ to, customerName, orderId, restaurantName }) => {
  const subject = `Order #${orderId} delivered successfully`;
  const html = getDeliveredEmailTemplate({ customerName, orderId, restaurantName });
  return await sendMail({ to, subject, html });
};

export const sendRefundEmail = async ({ to, customerName, orderId, refundAmount, gatewayName, status }) => {
  const isSuccess = status === 'success';
  const subject = isSuccess
    ? `Refund for order ${orderId} successful`
    : `Refund update for order ${orderId}`;

  const html = getRefundEmailTemplate({ customerName, orderId, refundAmount, gatewayName, status });
  return await sendMail({ to, subject, html });
};

export const sendPaymentConfirmationEmail = async ({ to, customerName, orderId, amount, currency }) => {
  const subject = `Payment confirmed for Order #${orderId.slice(0, 8).toUpperCase()}`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
      <h2 style="color:#F97316;">Payment Confirmed! 🎉</h2>
      <p>Hi <strong>${customerName}</strong>,</p>
      <p>Your payment of <strong>${currency} ${amount}</strong> for Order <strong>#ORD${orderId.slice(0,8).toUpperCase()}</strong> has been successfully received.</p>
      <p>Your food is being prepared and will be delivered shortly.</p>
      <p style="color:#6B7280;font-size:12px;">Thank you for ordering with Orderly!</p>
    </div>
  `;
  try {
    return await sendMail({ to, subject, html });
  } catch (err) {
    console.warn('[MailService] Payment confirmation email failed (non-critical):', err.message);
  }
};
