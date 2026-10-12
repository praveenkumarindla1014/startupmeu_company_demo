import mongoose from 'mongoose';

/**
 * Connects to MongoDB. On failure we log a clear message and exit,
 * because the API is useless without a database and a crash-looping
 * process manager (or the developer) should see the failure immediately.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('[DB] MONGO_URI is not set. Add it to server/.env (see .env.example).');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // fail fast instead of hanging for 30s
    });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('[DB] Failed to connect to MongoDB.');
    console.error(`[DB] Reason: ${err.message}`);
    console.error('[DB] Check MONGO_URI, your network, and the Atlas IP access list.');
    process.exit(1);
  }

  // Log connection problems that happen after startup
  mongoose.connection.on('disconnected', () => console.warn('[DB] MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('[DB] MongoDB reconnected'));
  mongoose.connection.on('error', (err) => console.error(`[DB] MongoDB error: ${err.message}`));
};

export default connectDB;
