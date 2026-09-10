import http from 'http';
import app from './app.js';
import env from './config/env.js';
import prisma from './config/prisma.js';

const server = http.createServer(app);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Orderly Order Service: Database connected (Neon PostgreSQL)');

    server.listen(env.port, () => {
      console.log(`Orderly Order Microservice running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (error) {
    console.error('Failed to start Order Service:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down Order Service gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('Prisma disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Error during Prisma disconnect:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
