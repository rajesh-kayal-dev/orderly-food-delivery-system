import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { sequelize } from './models/index.js';
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from "vnpay";

// Load env vars
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust this in production
        methods: ["GET", "POST", "PUT"]
    }
});

// Enable CORS - Move to top and configure explicitly
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true
}));

// Body parser
app.use(express.json());



// Make io accessible in requests
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Import routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import customerAppRoutes from './routes/customerAppRoutes.js';
import deliveryPartnerRoutes from './routes/deliveryPartnerRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/customer', customerAppRoutes);
app.use('/api/delivery-partner', deliveryPartnerRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/payments', paymentRoutes);

import dispatchService from './services/dispatch/dispatchService.js';
import { DeliveryPartner } from './models.js';

// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log('Socket.io: A user connected:', socket.id);

    // Join room based on userId for targeted notifications
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`Socket.io: User ${userId} joined notification room (Socket: ${socket.id})`);
    });

    // Driver specific room join using driverId
    socket.on('join_driver', ({ driverId, userId }) => {
        if (driverId) socket.join(`driver_${driverId}`);
        if (userId) socket.join(userId);
        console.log(`Socket.io: Driver ${driverId} (User: ${userId}) joined room driver_${driverId}`);
    });

    // Driver online/offline status broadcast
    socket.on('DRIVER_STATUS_UPDATED', (data) => {
        console.log('Socket.io: Broadcasting DRIVER_STATUS_UPDATED:', data);
        io.emit('DRIVER_STATUS_UPDATED', data);
    });

    // Driver location update event
    socket.on('DRIVER_UPDATE_LOCATION', async (data) => {
        try {
            const { driverId, latitude, longitude } = data;
            if (driverId && latitude && longitude) {
                await DeliveryPartner.update(
                    {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        last_location_update: new Date()
                    },
                    { where: { id: driverId } }
                );
            }
        } catch (err) {
            console.error('Error updating driver location:', err);
        }
    });

    // Driver accepts offer event
    socket.on('ACCEPT_ORDER_OFFER', async (data, callback) => {
        try {
            const { orderId, userId } = data;
            const order = await dispatchService.handleDriverAccept(orderId, userId, io);
            if (callback) callback({ success: true, data: order });
        } catch (err) {
            console.error('Error accepting order offer:', err.message);
            if (callback) callback({ success: false, message: err.message });
        }
    });

    // Driver declines/rejects offer event
    socket.on('REJECT_ORDER_OFFER', async (data, callback) => {
        try {
            const { orderId, userId, reason } = data;
            await dispatchService.handleDriverReject(orderId, userId, reason, io);
            if (callback) callback({ success: true });
        } catch (err) {
            console.error('Error rejecting order offer:', err.message);
            if (callback) callback({ success: false, message: err.message });
        }
    });

    // Legacy room for available deliveries
    socket.on('join_deliveries', () => {
        socket.join('available_deliveries');
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket.io: User disconnected. Reason:', reason);
    });
});

// Database Sync & Recovery Startup
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('Sequelize connected to Neon Postgres DB');
        await dispatchService.recoverOrphanedDispatches(io);
    } catch (err) {
        console.error('Database connection warning:', err.message);
    }
});

