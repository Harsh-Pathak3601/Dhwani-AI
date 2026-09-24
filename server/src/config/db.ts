import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      logger.warn('MongoDB URI not found, running without DB for now.');
      return;
    }
    mongoose.set('bufferCommands', false);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxIdleTimeMS: 30000,
      family: 4,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error(`Error: ${error.message}`);
  }
};

export default connectDB;
