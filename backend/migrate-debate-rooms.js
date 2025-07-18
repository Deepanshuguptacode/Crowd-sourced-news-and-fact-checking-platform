// Database migration script for debate room collections
// Run with: node migrate-debate-rooms.js

const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/DBMS', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function migrateDebateRooms() {
  try {
    console.log('🚀 Starting debate room migration...');
    
    // Create indexes for better performance
    console.log('📊 Creating database indexes...');
    
    // DebateRoom indexes
    const debateRoomCollection = mongoose.connection.collection('debaterooms');
    await debateRoomCollection.createIndex({ isActive: 1 });
    await debateRoomCollection.createIndex({ creator: 1 });
    await debateRoomCollection.createIndex({ createdAt: -1 });
    await debateRoomCollection.createIndex({ 
      title: 'text', 
      description: 'text', 
      topic: 'text' 
    });
    console.log('✅ DebateRoom indexes created');
    
    // DebateGroup indexes
    const debateGroupCollection = mongoose.connection.collection('debategroups');
    await debateGroupCollection.createIndex({ debateRoomId: 1 });
    await debateGroupCollection.createIndex({ debateRoomId: 1, stance: 1 });
    await debateGroupCollection.createIndex({ displayOrder: 1 });
    await debateGroupCollection.createIndex({ counterGroupId: 1 });
    console.log('✅ DebateGroup indexes created');
    
    // DebateComment indexes
    const debateCommentCollection = mongoose.connection.collection('debatecomments');
    await debateCommentCollection.createIndex({ debateRoomId: 1 });
    await debateCommentCollection.createIndex({ groupId: 1 });
    await debateCommentCollection.createIndex({ author: 1 });
    await debateCommentCollection.createIndex({ createdAt: -1 });
    await debateCommentCollection.createIndex({ debateRoomId: 1, stance: 1 });
    console.log('✅ DebateComment indexes created');
    
    console.log('🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('  - DebateRoom collection: Ready for room management');
    console.log('  - DebateGroup collection: Ready for AI-powered grouping');
    console.log('  - DebateComment collection: Ready for commenting system');
    console.log('  - All indexes created for optimal performance');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
migrateDebateRooms();
