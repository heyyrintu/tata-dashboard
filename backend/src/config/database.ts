import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tata-dashboard';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Server will start but database operations may fail.');
    console.log('💡 Please start MongoDB to enable full functionality.');
    // Don't exit - let the server start anyway
  }
};

