import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({
  origin: env.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Razorpay-Signature'],
  credentials: true
}));

/**
 * IMPORTANT: express.json() is applied globally EXCEPT on the /webhook route.
 * The webhook route uses captureRawBody to preserve the raw bytes for HMAC verification.
 * This is handled inside paymentRoutes.js — the webhook route registers captureRawBody BEFORE
 * the global json() would run. Express will skip the global json() body-parser for requests
 * that have already been consumed by a stream listener.
 */
app.use((req, res, next) => {
  // Skip global JSON parsing for the webhook route — rawBody middleware handles it
  if (req.path === '/api/payments/webhook') return next();
  express.json()(req, res, next);
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'payment-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Payment Routes
app.use('/api/payments', paymentRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
