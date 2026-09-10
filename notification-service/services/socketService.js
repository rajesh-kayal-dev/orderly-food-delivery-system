export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Notification Service] Client connected: ${socket.id}`);

    socket.on('join', (room) => {
      socket.join(room);
      console.log(`[Notification Service] Client ${socket.id} joined room: ${room}`);
    });

    socket.on('join_driver', ({ driverId, userId }) => {
      if (driverId) socket.join(`driver_${driverId}`);
      if (userId) socket.join(userId);
      console.log(`[Notification Service] Driver ${driverId} (User: ${userId}) joined room`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Notification Service] Client disconnected: ${socket.id} (${reason})`);
    });
  });
};

export const emitEvent = (io, { room, event, data }) => {
  if (!io || !event) return;

  if (room) {
    io.to(room).emit(event, data);
    console.log(`[Notification Service] Emitted event '${event}' to room '${room}'`);
  } else {
    io.emit(event, data);
    console.log(`[Notification Service] Emitted event '${event}' globally`);
  }
};
