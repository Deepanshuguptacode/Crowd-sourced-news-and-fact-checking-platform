const mongoose = require('mongoose');
require('dotenv').config(); // This will load .env by default

const testDefaultEnv = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('MongoDB URI from .env:', mongoUri);
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env file');
    }
    
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Test if we can access the database
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    console.log('✅ Database ping successful:', result);
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

testDefaultEnv();