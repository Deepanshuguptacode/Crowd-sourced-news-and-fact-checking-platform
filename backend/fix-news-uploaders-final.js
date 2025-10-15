const mongoose = require('mongoose');
require('dotenv').config();

// Import models
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

// Fix news uploader assignments with existing users
const fixNewsUploadersFinal = async () => {
  try {
    await connectDB();
    
    console.log('🔧 FINAL FIX FOR NEWS UPLOADERS\n');
    
    // Get existing users
    const existingUsers = await CommunityUser.find({});
    console.log(`Found ${existingUsers.length} existing users:`);
    existingUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.username}) - ${user._id}`);
    });
    
    if (existingUsers.length === 0) {
      console.log('❌ No users found! Cannot assign uploaders.');
      return;
    }
    
    // Get all news
    const allNews = await News.find({});
    console.log(`\nFound ${allNews.length} news articles to fix`);
    
    let fixedCount = 0;
    
    // Assign each news article to a random existing user
    for (const news of allNews) {
      const randomUser = existingUsers[Math.floor(Math.random() * existingUsers.length)];
      
      await News.findByIdAndUpdate(news._id, {
        uploadedBy: randomUser._id
      });
      
      console.log(`  ✓ "${news.title.substring(0, 50)}..." → ${randomUser.name}`);
      fixedCount++;
    }
    
    console.log(`\n✅ Fixed ${fixedCount} news articles`);
    
    // Verify the fix
    console.log('\n🧪 VERIFICATION:');
    const verifyNews = await News.find({})
      .populate('uploadedBy', 'name username')
      .limit(3);
    
    verifyNews.forEach((news, index) => {
      console.log(`  ${index + 1}. "${news.title.substring(0, 50)}..."`);
      console.log(`     Uploader: ${news.uploadedBy?.name || 'FAILED'} (${news.uploadedBy?.username || 'NO USERNAME'})`);
    });
    
    // Final count
    const newsWithUploaders = await News.countDocuments({ uploadedBy: { $ne: null } });
    const workingUploaders = await News.find({}).populate('uploadedBy');
    const actuallyWorking = workingUploaders.filter(n => n.uploadedBy && n.uploadedBy.name).length;
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`  News with uploader IDs: ${newsWithUploaders}`);
    console.log(`  News with working uploaders: ${actuallyWorking}`);
    
    if (actuallyWorking > 0) {
      console.log('\n🎉 SUCCESS! News uploaders are now working correctly!');
      console.log('Your frontend should now show proper uploader names instead of "dataset_uploader"');
    } else {
      console.log('\n❌ Something is still wrong with the uploader population');
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the final fix
fixNewsUploadersFinal();