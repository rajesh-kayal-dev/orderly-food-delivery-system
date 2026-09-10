import express from 'express';
import { emitEvent } from '../services/socketService.js';

export default function createSocketRouter(io) {
  const router = express.Router();

  router.post('/emit', (req, res, next) => {
    try {
      const { room, event, data } = req.body;
      emitEvent(io, { room, event, data });
      return res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
