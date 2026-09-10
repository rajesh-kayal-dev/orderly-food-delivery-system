import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mailRoutes from './routes/mailRoutes.js';
import createSocketRouter from './routes/socketRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
}));

app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use('/api/notifications/mail', mailRoutes);
app.use('/api/notifications/realtime', createSocketRouter(io));

io.on('connection', (socket) => {
    console.log(`Orderly Notification Service: Client connected: ${socket.id}`);

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`Client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
    console.log(`Orderly Notification Microservice running on port ${PORT}`);
});
