import express, { Express } from 'express';
import http from 'http';
import dns from 'dns';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';

/**
 * ─── IPv6 RESOLUTION FIX ───
 * Forces Node.js to resolve hostname mappings to IPv4 addresses first.
 * Bypasses network lookup failures (ENOTFOUND) common in Windows/Node.js undici fetch routines.
 */
dns.setDefaultResultOrder('ipv4first');
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { setupCallSocket } from './sockets/callSocket.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import reportRoutes from './routes/reports.js';
import communityRoutes from './routes/community.js';
import deepgramRoutes from './routes/deepgram.js';
import voiceRoutes from './routes/voiceApi.js';
import enterpriseRoutes from './routes/enterpriseApi.js';
import modulateRoutes from './routes/modulateApi.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

dotenv.config();

const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const cleanClientUrl = rawClientUrl.replace(/\/+$/, '');
const allowedOrigins = Array.from(new Set([cleanClientUrl, 'http://localhost:5173']));

export const app: Express = express();

// Enable trust proxy for reverse proxies (Render, Heroku, Cloudflare)
// Ensures req.ip accurately reflects the client IP address from X-Forwarded-For
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // Defines allowed origins for Socket.io cross-origin resource sharing
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalized) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ─── EXPRESS MIDDLEWARE SETUP ───

// Helmet adds Express security headers to protect against common web vulnerabilities
app.use(helmet());

// Lightweight health check endpoint for external pingers / keep-awake monitors
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

/**
 * ─── RATE LIMITER SETUP ───
 * Limits incoming requests to prevent DDoS and brute-force attacks.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes(normalized) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/deepgram', deepgramRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/modulate', modulateRoutes);

// Error Handler
app.use(errorHandler);



// Socket.IO
io.on('connection', (socket: Socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  setupCallSocket(socket, io);
});

const PORT = process.env.PORT || 3001;

/**
 * ─── STARTUP DATABASE HANDLERS ───
 * Initializes the MongoDB connection before starting the Express server to ensure
 * database readiness. Catches connection errors to prevent silent failures.
 */
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  }).catch((err: any) => {
    logger.error('Failed to connect to database', { error: err.message });
  });
}

/**
 * ─── GRACEFUL SHUTDOWN HANDLER ───
 * Ensures clean termination by closing all active connections before process exit.
 * Handles SIGTERM (container orchestrators) and SIGINT (Ctrl+C) signals.
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
  });

  io.disconnectSockets(true);
  logger.info('All Socket.IO clients disconnected');

  try {
    const mongoose = await import('mongoose');
    await mongoose.default.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err: any) {
    logger.error('Error closing MongoDB connection', { error: err.message });
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
