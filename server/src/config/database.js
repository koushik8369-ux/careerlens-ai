import mongoose from 'mongoose';

export function getMongoUri(env = process.env) {
  const uri = env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('MONGODB_URI must be configured before connecting to MongoDB.');
  }
  return uri;
}

export function getDatabaseStatus(connection = mongoose.connection) {
  return connection.readyState === 1 ? 'connected' : 'disconnected';
}

export async function connectDatabase({ env = process.env, client = mongoose, logger = console } = {}) {
  const uri = getMongoUri(env);

  try {
    await client.connect(uri, { serverSelectionTimeoutMS: 5000 });
    logger.info('MongoDB connection established.');
  } catch (error) {
    logger.error(`MongoDB connection failed (${error?.name || 'ConnectionError'}). Check MONGODB_URI and database availability.`);
    throw new Error('MongoDB connection failed. Check MONGODB_URI and database availability.');
  }
}