const mongoose = require('mongoose');
const News = require('./models/News');
require('dotenv').config();

const checkBuzzFeedNews = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check total news count
    const totalNews = await News.countDocuments({});
    console.log('Total news in database:', totalNews);
    
    // Find news with voting
    const newsWithVotes = await News.find({
      $or: [
        { upvotes: { $exists: true, $ne: [] } },
        { downvotes: { $exists: true, $ne: [] } }
      ]
    });
    
    console.log('News with votes:', newsWithVotes.length);
    
    // Sample a few with votes
    if (newsWithVotes.length > 0) {
      console.log('\nSample voting results:');
      newsWithVotes.slice(0, 3).forEach((news, index) => {
        const upvotes = news.upvotes?.length || 0;
        const downvotes = news.downvotes?.length || 0;
        const total = upvotes + downvotes;
        const percentage = total > 0 ? ((upvotes / total) * 100).toFixed(1) : 0;
        
        console.log(`${index + 1}. ${news.title.substring(0, 50)}...`);
        console.log(`   Upvotes: ${upvotes}, Downvotes: ${downvotes}, Percentage: ${percentage}%`);
      });
    }
    
    // Check for our inserted news by looking for specific patterns
    const buzzfeedLike = await News.find({
      $or: [
        { title: { $regex: 'Trump', $options: 'i' } },
        { title: { $regex: 'Clinton', $options: 'i' } },
        { title: { $regex: 'Obama', $options: 'i' } }
      ]
    });
    
    console.log(`\nBuzzFeed-style news found: ${buzzfeedLike.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

checkBuzzFeedNews();