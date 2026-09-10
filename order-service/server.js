import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import prisma from './config/prisma.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
}));

app.use(express.json());

app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 5001;

prisma.$connect().then(() => {
    console.log('Orderly Order Service Database connected (Neon PostgreSQL)');
    server.listen(PORT, () => {
        console.log(`Orderly Order Microservice running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect database in Order Service:', err);
});
