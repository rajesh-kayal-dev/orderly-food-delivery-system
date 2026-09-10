import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.GATEWAY_PORT) || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
  ],
  services: {
    backend: process.env.BACKEND_URL || 'http://localhost:5001',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:5002',
    identity: process.env.IDENTITY_SERVICE_URL || 'http://localhost:5003',
    restaurant: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:5004',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005'
  }
};

export default env;
