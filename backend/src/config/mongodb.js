import mongoose from 'mongoose';
import { MONGODB_URI } from './config.js';

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    cachedConnection = connection;
    console.log('✅ MongoDB Connected');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    if (!process.env.VERCEL) process.exit(1);
    throw error;
  }
};

export default connectDB;
