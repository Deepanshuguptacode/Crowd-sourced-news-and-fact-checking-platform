const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const News = require('./models/News');
const { CommunityComment } = require('./models/Comments');
const { CommentGroup, CommentFilter } = require('./models/CommentFilter');
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');

async function verifyDataLocation() {
    try {
        console.log('🔍 VERIFYING DATA LOCATION AND ACCESS\n');
        
        // Show the MongoDB URI being used
        const mongoUri = process.env.MONGODB_URI;
        console.log('📍 MONGODB URI BEING USED:');
        console.log(`   ${mongoUri}\n`);
        
        // Parse the URI to show cluster details
        const uriParts = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)/);
        if (uriParts) {
            console.log('🏗️  CONNECTION DETAILS:');
            console.log(`   Username: ${uriParts[1]}`);
            console.log(`   Password: [HIDDEN]`);
            console.log(`   Cluster: ${uriParts[3]}`);
            console.log(`   Database: ${mongoUri.includes('?') ? 'Default (from connection string)' : 'Not specified'}\n`);
        }

        // Connect to database
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB successfully\n');

        // Show current database name
        const dbName = mongoose.connection.db.databaseName;
        console.log(`🗄️  CURRENT DATABASE: ${dbName}\n`);

        // Check collections and data
        console.log('📊 DATA VERIFICATION:\n');

        // 1. Check News collection
        const totalNews = await News.countDocuments();
        const fakeNews = await News.find({ 
            _id: { $in: [
                '68ef91ef3bda87128d26e22c',
                '68ef91ef3bda87128d26e22e', 
                '68ef91ef3bda87128d26e232',
                '68ef91ef3bda87128d26e234',
                '68ef91ef3bda87128d26e238'
            ]}
        });
        console.log(`1. 📰 NEWS COLLECTION:`);
        console.log(`   Total news: ${totalNews}`);
        console.log(`   Target fake news found: ${fakeNews.length}/5`);
        fakeNews.forEach((news, i) => {
            console.log(`      ${i+1}. "${news.title?.substring(0, 50)}..." (${news._id})`);
        });

        // 2. Check Comments collection
        const totalComments = await CommunityComment.countDocuments();
        const recentComments = await CommunityComment.find({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        console.log(`\n2. 💬 COMMENTS COLLECTION:`);
        console.log(`   Total comments: ${totalComments}`);
        console.log(`   Recent comments (last 24h): ${recentComments.length}`);
        
        // Check comments per target news
        for (const news of fakeNews) {
            const commentCount = await CommunityComment.countDocuments({ newsId: news._id });
            console.log(`      "${news.title?.substring(0, 30)}...": ${commentCount} comments`);
        }

        // 3. Check Comment Groups
        const totalGroups = await CommentGroup.countDocuments();
        const recentGroups = await CommentGroup.find({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        console.log(`\n3. 📦 COMMENT GROUPS COLLECTION:`);
        console.log(`   Total groups: ${totalGroups}`);
        console.log(`   Recent groups (last 24h): ${recentGroups.length}`);

        // 4. Check Comment Filters
        const totalFilters = await CommentFilter.countDocuments();
        console.log(`\n4. 🔗 COMMENT FILTERS COLLECTION:`);
        console.log(`   Total filters: ${totalFilters}`);

        // 5. Check Users
        const communityUsers = await CommunityUser.countDocuments();
        const expertUsers = await ExpertUser.countDocuments();
        console.log(`\n5. 👥 USERS COLLECTIONS:`);
        console.log(`   Community users: ${communityUsers}`);
        console.log(`   Expert users: ${expertUsers}`);

        // Show sample recent data
        if (recentComments.length > 0) {
            console.log(`\n📋 SAMPLE RECENT DATA:`);
            const sampleComment = recentComments[0];
            console.log(`   Sample Comment ID: ${sampleComment._id}`);
            console.log(`   News ID: ${sampleComment.newsId}`);
            console.log(`   Commenter: ${sampleComment.commenter}`);
            console.log(`   Stance: ${sampleComment.stance}`);
            console.log(`   Expert votes: ${sampleComment.expertVotes?.length || 0}`);
            console.log(`   Evidence links: ${sampleComment.evidenceLinks?.length || 0}`);
            console.log(`   Created: ${sampleComment.createdAt}`);
        }

        // MongoDB Compass connection info
        console.log(`\n🧭 MONGODB COMPASS CONNECTION:`);
        console.log(`   Use this connection string in MongoDB Compass:`);
        console.log(`   ${mongoUri}`);
        console.log(`   Navigate to database: ${dbName}`);
        console.log(`   Check collections: CommunityComment, CommentGroup, CommentFilter`);

        console.log(`\n✅ DATA VERIFICATION COMPLETE!`);
        
        if (recentComments.length === 0) {
            console.log(`\n⚠️  NO RECENT COMMENTS FOUND - Data might be in a different database or not inserted yet`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n📁 Database connection closed');
    }
}

verifyDataLocation();