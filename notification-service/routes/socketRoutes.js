import express from 'express';

export default function createSocketRouter(io) {
    const router = express.Router();

    router.post('/emit', (req, res) => {
        const { room, event, data } = req.body;
        
        if (room) {
            io.to(room).emit(event, data);
            console.log(`Emitted ${event} to room ${room}`);
        } else {
            io.emit(event, data);
            console.log(`Emitted ${event} to everyone`);
        }
        
        res.json({ success: true });
    });

    return router;
}
