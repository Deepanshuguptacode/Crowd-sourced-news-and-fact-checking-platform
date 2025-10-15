const mongoose = require('mongoose');
const { CommunityComment } = require('./models/Comments');
const News = require('./models/News');
require('dotenv').config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Delete all comments
    const deleteResult = await CommunityComment.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} comments`);
    
    // Clear comment references from news
    const updateResult = await News.updateMany({}, { $set: { comments: [] } });
    console.log(`Updated ${updateResult.modifiedCount} news articles`);
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

cleanup();