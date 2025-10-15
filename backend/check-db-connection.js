const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.production' });

const testConnection = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('MongoDB URI from .env.production:', mongoUri);
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env.production file');
    }
    
    // Check if the URI contains placeholder password
    if (mongoUri.includes('<') && mongoUri.includes('>')) {
      console.error('❌ MongoDB URI contains placeholder password!');
      console.error('Please replace <deepanshuguptacode> with your actual MongoDB Atlas password in .env.production');
      console.error('The format should be: mongodb+srv://deepanshugupta650:YOUR_ACTUAL_PASSWORD@voxveritas.lst4gcg.mongodb.net/...');
      process.exit(1);
    }
    
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Test if we can access the database
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    console.log('✅ Database ping successful:', result);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Ensure your MongoDB Atlas password is correct in .env.production');
    console.error('2. Check if your IP address is whitelisted in MongoDB Atlas');
    console.error('3. Verify the database user has proper permissions');
    process.exit(1);
  }
};

testConnection();