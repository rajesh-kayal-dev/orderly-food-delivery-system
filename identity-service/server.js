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

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

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
