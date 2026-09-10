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

const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

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
