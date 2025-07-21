const mongoose = require('mongoose');
require('dotenv').config();

// Your local MongoDB connection
const localDB = 'mongodb://127.0.0.1:27017/DBMS';

// Your Atlas MongoDB connection
const atlasDB = process.env.MONGODB_URI;

const migrateData = async () => {
  try {
    // Connect to local database
    const localConnection = await mongoose.createConnection(localDB);
    console.log('Connected to local database');

    // Connect to Atlas database
    const atlasConnection = await mongoose.createConnection(atlasDB);
    console.log('Connected to Atlas database');

    // Get all collections from local database
    const collections = await localConnection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Migrating collection: ${collectionName}`);
      
      // Get data from local collection
      const localData = await localConnection.db.collection(collectionName).find({}).toArray();
      
      if (localData.length > 0) {
        // Insert data to Atlas collection
        await atlasConnection.db.collection(collectionName).insertMany(localData);
        console.log(`Migrated ${localData.length} documents from ${collectionName}`);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateData();
