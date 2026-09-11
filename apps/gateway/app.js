import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import helmet from 'helmet';
import env from './config/env.js';
import { createServiceProxy } from './config/proxy.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

app.use(cors({
  origin: env.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Proxy routes mapped to microservices
app.use('/api/auth', createServiceProxy('identity-service', env.services.identity));

app.use('/api/admin/orders', createServiceProxy('order-service', env.services.order));
app.use('/api/admin', createServiceProxy('identity-service', env.services.identity));

app.use(['/api/restaurants', '/api/menu'], createServiceProxy('restaurant-service', env.services.restaurant));

// Payments → dedicated payment-service (Razorpay)
app.use('/api/payments', createServiceProxy('payment-service', env.services.payment));

app.use(['/api/orders', '/api/cart'], createServiceProxy('order-service', env.services.order));

app.use('/api/notifications', createServiceProxy('notification-service', env.services.notification));

// Fallback / legacy proxy to backend monolith
app.use('/api', createServiceProxy('backend', env.services.backend));

// WebSocket proxy for Socket.IO
export const socketProxy = createServiceProxy('notification-socket', env.services.notification, {
  ws: true,
  onError: (err) => {
    console.error('[Gateway Socket Proxy Error]:', err.message);
  }
});

app.use('/socket.io', socketProxy);

export default app;
