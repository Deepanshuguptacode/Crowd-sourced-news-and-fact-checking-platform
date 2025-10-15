const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const News = require('./models/News');
const { CommunityComment } = require('./models/Comments');
const { CommentGroup, CommentFilter } = require('./models/CommentFilter');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');

async function checkCurrentDatabaseState() {
    try {
        console.log('🔍 CHECKING CURRENT DATABASE STATE\n');
        
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB successfully');
        
        const dbName = mongoose.connection.db.databaseName;
        console.log(`🗄️  Database: ${dbName}\n`);

        // Check all collections
        console.log('📊 COLLECTION ANALYSIS:\n');

        // 1. News Collection
        const allNews = await News.find({}).limit(10);
        console.log(`1. 📰 NEWS COLLECTION (${allNews.length} shown, total: ${await News.countDocuments()}):`);
        allNews.forEach((news, i) => {
            console.log(`   ${i+1}. "${news.title?.substring(0, 60)}..." 
      ID: ${news._id}
      Type: ${news.newsType || 'undefined'}
      Uploader: ${news.uploader || 'undefined'}`);
        });

        // 2. Community Comments
        const allComments = await CommunityComment.find({}).limit(5).populate('newsId').populate('commenter');
        console.log(`\n2. 💬 COMMUNITY COMMENTS (${allComments.length} shown, total: ${await CommunityComment.countDocuments()}):`);
        allComments.forEach((comment, i) => {
            console.log(`   ${i+1}. Comment ID: ${comment._id}
      News: "${comment.newsId?.title?.substring(0, 40)}..."
      Commenter: ${comment.commenter?.username || 'Unknown'}
      Stance: ${comment.stance}
      Expert Votes: ${comment.expertVotes?.length || 0}
      Evidence Links: ${comment.evidenceLinks?.length || 0}
      Created: ${comment.createdAt}`);
        });

        // 3. Comment Groups
        const allGroups = await CommentGroup.find({}).limit(5);
        console.log(`\n3. 📦 COMMENT GROUPS (${allGroups.length} shown, total: ${await CommentGroup.countDocuments()}):`);
        allGroups.forEach((group, i) => {
            console.log(`   ${i+1}. Group ID: ${group._id}
      Label: "${group.label}"
      News ID: ${group.newsId}
      Comments: ${group.comments?.length || 0}
      Created: ${group.createdAt}`);
        });

        // 4. Comment Filters  
        const allFilters = await CommentFilter.find({}).limit(5);
        console.log(`\n4. 🔗 COMMENT FILTERS (${allFilters.length} shown, total: ${await CommentFilter.countDocuments()}):`);
        allFilters.forEach((filter, i) => {
            console.log(`   ${i+1}. Filter ID: ${filter._id}
      Original Comment ID: ${filter.originalCommentId}
      Group ID: ${filter.groupId}
      News ID: ${filter.newsId}
      Text: "${filter.text?.substring(0, 50)}..."`);
        });

        // 5. Users
        const communityUsers = await CommunityUser.find({}).limit(5);
        const expertUsers = await ExpertUser.find({});
        console.log(`\n5. 👥 USERS:`);
        console.log(`   Community Users (${communityUsers.length} shown, total: ${await CommunityUser.countDocuments()}):`);
        communityUsers.forEach((user, i) => {
            console.log(`      ${i+1}. ${user.username} (${user.fullName || 'No name'})`);
        });
        console.log(`   Expert Users (${expertUsers.length} total):`);
        expertUsers.forEach((user, i) => {
            console.log(`      ${i+1}. ${user.username} - ${user.areaOfExpertise?.join(', ') || 'No expertise'}`);
        });

        // Check if we have any fake news with specific IDs
        const targetNewsIds = [
            '68ef91ef3bda87128d26e22c',
            '68ef91ef3bda87128d26e22e', 
            '68ef91ef3bda87128d26e232',
            '68ef91ef3bda87128d26e234',
            '68ef91ef3bda87128d26e238'
        ];

        console.log(`\n6. 🎯 TARGET FAKE NEWS CHECK:`);
        for (const newsId of targetNewsIds) {
            try {
                const news = await News.findById(newsId);
                const commentCount = await CommunityComment.countDocuments({ newsId: newsId });
                const groupCount = await CommentGroup.countDocuments({ newsId: newsId });
                
                if (news) {
                    console.log(`   ✅ "${news.title?.substring(0, 50)}..."
      Comments: ${commentCount}, Groups: ${groupCount}`);
                } else {
                    console.log(`   ❌ News ID ${newsId} not found`);
                }
            } catch (error) {
                console.log(`   ❌ Error checking ${newsId}: ${error.message}`);
            }
        }

        // Database requirements check
        console.log(`\n📋 REQUIREMENTS STATUS:`);
        const totalComments = await CommunityComment.countDocuments();
        const totalGroups = await CommentGroup.countDocuments();
        const totalFilters = await CommentFilter.countDocuments();
        
        console.log(`   📊 Comments in DB: ${totalComments}`);
        console.log(`   📊 Groups in DB: ${totalGroups}`);
        console.log(`   📊 Filters in DB: ${totalFilters}`);
        console.log(`   📊 Community Users: ${await CommunityUser.countDocuments()}`);
        console.log(`   📊 Expert Users: ${await ExpertUser.countDocuments()}`);

        // Determine if we need to recreate data
        console.log(`\n🔧 RECOMMENDED ACTION:`);
        if (totalComments < 100 || totalGroups < 50 || totalFilters < 100) {
            console.log(`   ⚠️  INCOMPLETE DATA DETECTED`);
            console.log(`   🔄 Need to run complete fake news comment generation`);
            console.log(`   📝 Expected: 100 comments, 55 groups, 100 filters for 5 fake news articles`);
        } else {
            console.log(`   ✅ Data appears complete - please check if you're looking in the right database/collections`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n📁 Database connection closed');
    }
}

checkCurrentDatabaseState();