const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.production' });

// Import models
const News = require('./models/News');
const NormalUser = require('./models/NormalUser');

const verifyInsertedData = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas for verification');
    
    // Count total news
    const totalNews = await News.countDocuments();
    console.log(`📊 Total news in database: ${totalNews}`);
    
    // Count by status
    const fakeNewsCount = await News.countDocuments({ status: 'Fake' });
    const realNewsCount = await News.countDocuments({ status: 'Verified' });
    const pendingNewsCount = await News.countDocuments({ status: 'Pending' });
    
    console.log(`🚫 Fake news count: ${fakeNewsCount}`);
    console.log(`✅ Real news count: ${realNewsCount}`);
    console.log(`⏳ Pending news count: ${pendingNewsCount}`);
    
    // Check sample user
    const sampleUser = await NormalUser.findOne({ username: 'dataset_uploader' });
    if (sampleUser) {
      console.log(`👤 Sample user found: ${sampleUser.name} (ID: ${sampleUser._id})`);
      
      // Count news uploaded by sample user
      const newsUploadedBySampleUser = await News.countDocuments({ uploadedBy: sampleUser._id });
      console.log(`📝 News uploaded by sample user: ${newsUploadedBySampleUser}`);
    }
    
    // Get recent news (last 10)
    const recentNews = await News.find()
      .sort({ uploadedAt: -1 })
      .limit(10)
      .select('title status uploadedAt')
      .populate('uploadedBy', 'name username');
    
    console.log('\n📰 Recent News (Last 10):');
    recentNews.forEach((news, index) => {
      console.log(`${index + 1}. [${news.status}] ${news.title.substring(0, 60)}...`);
      console.log(`   Uploaded by: ${news.uploadedBy.name} on ${news.uploadedAt.toISOString().split('T')[0]}`);
    });
    
    // Verify against the inserted IDs files
    const fs = require('fs');
    const path = require('path');
    
    try {
      const fakeNewsIds = JSON.parse(fs.readFileSync(path.join(__dirname, 'inserted_fake_news_ids.json'), 'utf8'));
      const realNewsIds = JSON.parse(fs.readFileSync(path.join(__dirname, 'inserted_real_news_ids.json'), 'utf8'));
      
      console.log('\n🔍 Verifying inserted news IDs:');
      
      // Check if all fake news IDs exist
      for (const id of fakeNewsIds) {
        const news = await News.findById(id);
        if (news && news.status === 'Fake') {
          console.log(`✓ Fake news verified: ${id}`);
        } else {
          console.log(`❌ Fake news NOT found: ${id}`);
        }
      }
      
      // Check if all real news IDs exist
      for (const id of realNewsIds) {
        const news = await News.findById(id);
        if (news && news.status === 'Verified') {
          console.log(`✓ Real news verified: ${id}`);
        } else {
          console.log(`❌ Real news NOT found: ${id}`);
        }
      }
      
    } catch (fileError) {
      console.log('⚠️  Could not read ID files for verification:', fileError.message);
    }
    
    console.log('\n✅ Database verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

verifyInsertedData();