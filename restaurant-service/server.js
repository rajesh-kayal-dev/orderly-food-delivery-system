const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const prisma = require('./config/prisma');

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

const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');

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
