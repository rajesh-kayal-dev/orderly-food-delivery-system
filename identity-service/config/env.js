import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5003,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'orderly_super_secret_jwt_key_2026_dev',
  corsOrigins: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : [])
  ]
};

export default env;
