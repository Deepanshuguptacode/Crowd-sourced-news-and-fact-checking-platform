const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { CommentGroup } = require('./models/CommentFilter');
const News = require('./models/News');
const CommunityUser = require('./models/CommunityUser');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Final verification of fixes
const finalVerification = async () => {
  try {
    await connectDB();
    
    console.log('🔍 FINAL VERIFICATION OF FIXES\n');
    
    // 1. Test comment groups with populate
    console.log('1. COMMENT GROUPS TEST:');
    const testGroups = await CommentGroup.find({ comments: { $ne: [] } })
      .populate('comments', 'comment commenter createdAt')
      .limit(5);
    
    testGroups.forEach((group, index) => {
      console.log(`   Group ${index + 1}: "${group.label}"`);
      console.log(`   Comments: ${group.comments.length}`);
      if (group.comments.length > 0) {
        console.log(`   Sample: "${group.comments[0].comment?.substring(0, 60) || 'ERROR: NO COMMENT TEXT'}..."`);
      }
      console.log('');
    });
    
    // 2. Test news with uploaders  
    console.log('2. NEWS UPLOADERS TEST:');
    
    // First check what users we have
    const users = await CommunityUser.find({}).limit(5);
    console.log(`   Available users in database: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`   User ${index + 1}: ${user.name} (${user.username}) - ID: ${user._id}`);
    });
    
    console.log('');
    
    // Test news population
    const testNews = await News.find({})
      .populate('uploadedBy', 'name username email')
      .limit(5);
    
    testNews.forEach((news, index) => {
      console.log(`   News ${index + 1}: "${news.title.substring(0, 50)}..."`);
      console.log(`   Uploader ID: ${news.uploadedBy?._id || news.uploadedBy || 'NULL'}`);
      console.log(`   Uploader Name: ${news.uploadedBy?.name || 'NOT FOUND'}`);
      console.log(`   Uploader Username: ${news.uploadedBy?.username || 'NOT FOUND'}`);
      console.log('');
    });
    
    // 3. Check if the user references are valid
    console.log('3. USER REFERENCE VALIDATION:');
    const newsWithInvalidUsers = await News.find({}).populate('uploadedBy');
    let invalidCount = 0;
    
    for (const news of newsWithInvalidUsers) {
      if (!news.uploadedBy) {
        invalidCount++;
      }
    }
    
    console.log(`   News with invalid user references: ${invalidCount}/${newsWithInvalidUsers.length}`);
    
    // 4. Final summary
    const groupsWorking = await CommentGroup.countDocuments({ comments: { $ne: [] } });
    const newsWithUsers = await News.countDocuments({ uploadedBy: { $ne: null } });
    
    console.log('\n📊 FINAL STATUS:');
    console.log(`   ✅ Comment groups with comments: ${groupsWorking}`);
    console.log(`   ✅ News articles with uploaders: ${newsWithUsers}`);
    
    console.log('\n🎯 FRONTEND READINESS:');
    console.log(`   Comment Groups: ${groupsWorking > 0 ? '✅ READY' : '❌ NOT WORKING'}`);
    console.log(`   News Uploaders: ${newsWithUsers > 0 ? '✅ READY' : '❌ NOT WORKING'}`);
    
    if (groupsWorking > 0) {
      console.log('\n🚀 Comment groups should now display with correct comment counts in your frontend!');
    }
    
    if (newsWithUsers > 0) {
      console.log('🚀 News articles should now show proper uploader names instead of "dataset_uploader"!');
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run verification
finalVerification();