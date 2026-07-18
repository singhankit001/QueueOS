import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000', // Allow frontend domain in prod
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join a room for a specific queue to receive queue-specific updates
    socket.on('join-queue', (queueId: string) => {
      socket.join(`queue-${queueId}`);
      console.log(`Socket ${socket.id} joined queue-${queueId}`);
    });

    socket.on('join-manager', (managerId: string) => {
      socket.join(`manager-${managerId}`);
      console.log(`Socket ${socket.id} joined manager-${managerId}`);
    });

    socket.on('leave-queue', (queueId: string) => {
      socket.leave(`queue-${queueId}`);
      console.log(`Socket ${socket.id} left queue-${queueId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
