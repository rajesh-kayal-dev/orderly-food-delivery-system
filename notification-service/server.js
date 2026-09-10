import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import env from './config/env.js';
import { initSocket } from './services/socketService.js';

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const app = createApp(io);
server.on('request', app);

initSocket(io);

const startServer = () => {
  server.listen(env.port, () => {
    console.log(`Orderly Notification Microservice running on port ${env.port} [${env.nodeEnv}]`);
  });
};

const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down Notification Service gracefully...`);
  io.close(() => {
    console.log('Socket.IO closed.');
  });
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
