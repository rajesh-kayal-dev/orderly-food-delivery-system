import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import prisma from './config/prisma.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

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

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5003;

prisma.$connect().then(() => {
    console.log('Orderly Identity Service Database connected (Neon PostgreSQL)');
    server.listen(PORT, () => {
        console.log(`Orderly Identity Microservice running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect database in Identity Service:', err);
});
