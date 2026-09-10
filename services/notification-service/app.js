import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import mailRoutes from './routes/mailRoutes.js';
import createSocketRouter from './routes/socketRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = (io) => {
  const app = express();

  app.use(cors({
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  }));

  app.use(express.json());

  // Health Check Endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'notification-service',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Routes
  app.use('/api/notifications/mail', mailRoutes);
  if (io) {
    app.use('/api/notifications/realtime', createSocketRouter(io));
  }

  // 404 Catch-all Middleware (Compatible with Express 4 & 5)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
