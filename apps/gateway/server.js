import http from 'http';
import app, { socketProxy } from './app.js';
import env from './config/env.js';

const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket.io')) {
    socketProxy.upgrade(req, socket, head);
  }
});

const startServer = () => {
  server.listen(env.port, () => {
    console.log(`Orderly API Gateway running on port ${env.port} [${env.nodeEnv}]`);
    console.log(`Routing table initialized:`);
    console.log(` - /api/auth             -> ${env.services.identity}`);
    console.log(` - /api/admin            -> ${env.services.identity}`);
    console.log(` - /api/restaurants,/menu -> ${env.services.restaurant}`);
    console.log(` - /api/payments         -> ${env.services.payment}`);
    console.log(` - /api/orders,/cart     -> ${env.services.order}`);
    console.log(` - /api/notifications    -> ${env.services.notification}`);
    console.log(` - /socket.io            -> ${env.services.notification}`);
    console.log(` - /api (fallback)       -> ${env.services.backend}`);
  });
};

const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down API Gateway gracefully...`);
  server.close(() => {
    console.log('Gateway HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
