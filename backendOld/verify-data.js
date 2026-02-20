// Quick test script to verify seeded data
const mongoose = require('mongoose');

const NormalUser = require('./models/NormalUser');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const News = require('./models/News');
const { CommunityComment, ExpertComment } = require('./models/Comments');
const DebateRoom = require('./models/DebateRoom');
const DebateComment = require('./models/DebateComment');

const verifyData = async () => {
  try {
    console.log('🔍 Verifying seeded data...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsourced-news');

    // Count documents
    const normalUsersCount = await NormalUser.countDocuments();
    const communityUsersCount = await CommunityUser.countDocuments();
    const expertUsersCount = await ExpertUser.countDocuments();
    const newsCount = await News.countDocuments();
    const communityCommentsCount = await CommunityComment.countDocuments();
    const expertCommentsCount = await ExpertComment.countDocuments();
    const debateRoomsCount = await DebateRoom.countDocuments();
    const debateCommentsCount = await DebateComment.countDocuments();

    console.log('📊 Database Statistics:');
    console.log(`👥 Normal Users: ${normalUsersCount}`);
    console.log(`🏘️ Community Users: ${communityUsersCount}`);
    console.log(`🎓 Expert Users: ${expertUsersCount}`);
    console.log(`📰 News Articles: ${newsCount}`);
    console.log(`💬 Community Comments: ${communityCommentsCount}`);
    console.log(`🔬 Expert Comments: ${expertCommentsCount}`);
    console.log(`🗣️ Debate Rooms: ${debateRoomsCount}`);
    console.log(`💭 Debate Comments: ${debateCommentsCount}\n`);

    // Sample data display
    console.log('📋 Sample Users:');
    const sampleNormalUser = await NormalUser.findOne().select('name username email');
    const sampleCommunityUser = await CommunityUser.findOne().select('name username email');
    const sampleExpertUser = await ExpertUser.findOne().select('name username profession');
    
    console.log(`Normal User: ${sampleNormalUser.name} (${sampleNormalUser.username})`);
    console.log(`Community User: ${sampleCommunityUser.name} (${sampleCommunityUser.username})`);
    console.log(`Expert User: ${sampleExpertUser.name} (${sampleExpertUser.username}) - ${sampleExpertUser.profession}\n`);

    console.log('📰 Sample News Articles:');
    const newsArticles = await News.find().select('title status uploadedBy').populate('uploadedBy', 'name').limit(3);
    newsArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} [${article.status}] - by ${article.uploadedBy.name}`);
    });

    console.log('\n🗣️ Sample Debate Rooms:');
    const debateRooms = await DebateRoom.find().select('title participants').populate('participants.userId', 'name').limit(2);
    debateRooms.forEach((room, index) => {
      console.log(`${index + 1}. ${room.title}`);
      console.log(`   Participants: ${room.participants.length} users`);
    });

    console.log('\n✅ Data verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    mongoose.disconnect();
  }
};

verifyData();
