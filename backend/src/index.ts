import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initSocket } from './services/socket.service';
import { errorHandler } from './middlewares/error.middleware';
import 'dotenv/config';

import authRoutes from './routes/auth.routes';
import queueRoutes from './routes/queue.routes';
import tokenRoutes from './routes/token.routes';
import analyticsRoutes from './routes/analytics.routes';
import extraRoutes from './routes/extra.routes';

const app = express();
const server = createServer(app);

// Init Socket.IO
initSocket(server);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', extraRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
