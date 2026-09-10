import express from 'express';
import nodemailer from 'nodemailer';
import {
    getDeliveredEmailTemplate,
    getRefundEmailTemplate,
    getApprovalStatusTemplate
} from '../mailTemplates.js';

const router = express.Router();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE || 'false') === 'true',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const sendEmail = async (options) => {
    return transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
    });
};

router.post('/send-approval-status', async (req, res) => {
    try {
        const { to, fullName, accountType, status, reason } = req.body;
        const normalizedStatus = String(status || '').toUpperCase();
        const isApproved = normalizedStatus === 'APPROVED';
        const roleLabel = accountType === 'restaurant' ? 'restaurant' : 'driver';

        const subject = isApproved
            ? `Your ${roleLabel} account has been approved`
            : `Account approval update`;

        const html = getApprovalStatusTemplate({ fullName, accountType, status, reason });

        await sendEmail({ to, subject, html });
        res.json({ success: true, message: 'Approval email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});

router.post('/send-order-delivered', async (req, res) => {
    try {
        const { to, customerName, orderId, restaurantName } = req.body;
        const subject = `Order #${orderId} delivered successfully`;
        const html = getDeliveredEmailTemplate({ customerName, orderId, restaurantName });

        await sendEmail({ to, subject, html });
        res.json({ success: true, message: 'Delivered email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});

router.post('/send-refund', async (req, res) => {
    try {
        const { to, customerName, orderId, refundAmount, gatewayName, status } = req.body;
        const isSuccess = status === 'success';
        const subject = isSuccess
            ? `Refund for order ${orderId} successful`
            : `Refund update for order ${orderId}`;

        const html = getRefundEmailTemplate({ customerName, orderId, refundAmount, gatewayName, status });

        await sendEmail({ to, subject, html });
        res.json({ success: true, message: 'Refund email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});

export default router;
