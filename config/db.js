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
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
};
module.exports = connectDB;
