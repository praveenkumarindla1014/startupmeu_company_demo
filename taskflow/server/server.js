import 'dotenv/config'; // load .env before anything reads process.env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Fail fast on missing configuration instead of failing on the first request
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`[CONFIG] Missing environment variables: ${missingEnv.join(', ')}`);
  console.error('[CONFIG] Copy server/.env.example to server/.env and fill in the values.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

// Only the configured frontend origin may call this API from a browser
app.use(
  cors({
    origin: CLIENT_URL.split(',').map((url) => url.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10kb' })); // small limit: task payloads are tiny

// Health check: reports API and database status (useful for uptime monitors)
app.get('/api/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    data: {
      api: 'ok',
      database: dbConnected ? 'connected' : 'disconnected',
      uptime: Math.round(process.uptime()),
    },
    message: dbConnected ? 'Service is healthy' : 'Database is not connected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Must come after all routes
app.use(notFound);
app.use(errorHandler);

// Last-resort safety nets: log clearly instead of dying silently
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[SERVER] TaskFlow API running on http://localhost:${PORT}`);
  });
};

start();
