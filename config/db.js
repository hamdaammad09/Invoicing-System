const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔍 Checking MONGO_URI...');
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI environment variable is not set');
      return false;
    }
    
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📝 MONGO_URI exists:', process.env.MONGO_URI ? 'Yes' : 'No');
    console.log('📝 MONGO_URI length:', process.env.MONGO_URI ? process.env.MONGO_URI.length : 0);
    
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return true;
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      // Modern MongoDB driver options
      maxPoolSize: 10, // Connection pool size
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      bufferCommands: false, // Disable mongoose buffering
    });
    
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  // Only log disconnection if it's not during shutdown
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Mongoose disconnected from MongoDB');
  }
});

// Handle process termination (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await mongoose.connection.close();
    console.log('✅ Server shutdown complete');
  } catch (error) {
    console.log('⚠️ Error during shutdown:', error.message);
  }
  process.exit(0);
});

module.exports = connectDB;
