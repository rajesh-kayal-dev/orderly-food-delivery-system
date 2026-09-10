import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import prisma from './config/prisma.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import menuRoutes from './routes/menuRoutes.js';

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

app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);

const PORT = process.env.PORT || 5002;

prisma.$connect().then(() => {
    console.log('Orderly Restaurant Service Database connected (Neon PostgreSQL)');
    server.listen(PORT, () => {
        console.log(`Orderly Restaurant Microservice running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect database in Restaurant Service:', err);
});
