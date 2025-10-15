const mongoose = require('mongoose');
require('dotenv').config();
const News = require('./models/News');
const { CommunityComment } = require('./models/Comments');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');

async function analyzeDataForPlan() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully\n');

        console.log('📊 ANALYZING CURRENT DATA FOR PLAN CREATION\n');

        // 1. Check fake news
        console.log('1. CHECKING FAKE NEWS:');
        const fakeNews = await News.find({ newsType: 'fake' }).limit(5);
        console.log(`   Found ${fakeNews.length} fake news articles:`);
        fakeNews.forEach((news, index) => {
            console.log(`   ${index + 1}. "${news.title?.substring(0, 60)}..." (ID: ${news._id})`);
        });

        // 2. Check community users
        console.log('\n2. CHECKING COMMUNITY USERS:');
        const communityUsers = await CommunityUser.find({}).limit(10);
        console.log(`   Found ${communityUsers.length} community users:`);
        communityUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username} (${user.fullName})`);
        });

        // 3. Check expert users
        console.log('\n3. CHECKING EXPERT USERS:');
        const expertUsers = await ExpertUser.find({});
        console.log(`   Found ${expertUsers.length} expert users:`);
        expertUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.username} (${user.fullName}) - ${user.areaOfExpertise?.join(', ')}`);
        });

        // 4. Check existing comments on fake news
        console.log('\n4. CHECKING EXISTING COMMENTS ON FAKE NEWS:');
        for (const news of fakeNews) {
            const commentCount = await CommunityComment.countDocuments({ newsId: news._id });
            console.log(`   "${news.title?.substring(0, 40)}...": ${commentCount} comments`);
        }

        console.log('\n📋 DATA ANALYSIS COMPLETE - READY FOR PLAN CREATION');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

analyzeDataForPlan();