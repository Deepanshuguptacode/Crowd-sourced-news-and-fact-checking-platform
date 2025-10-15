const mongoose = require('mongoose');
require('dotenv').config();

async function checkNewsIdAssociation() {
    try {
        // MongoDB connection
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('\n🔍 CHECKING NEWS ID ASSOCIATIONS\n');

        const CommentGroup = require('./models/CommentFilter').CommentGroup;
        const News = require('./models/News');

        // 1. Check all comment groups and their newsIds
        console.log('1. COMMENT GROUPS AND NEWS IDS:');
        const allGroups = await CommentGroup.find({ comments: { $ne: [] } }).limit(5);
        console.log(`   Found ${allGroups.length} groups with comments`);
        
        for (const group of allGroups) {
            console.log(`   Group: "${group.label}" -> NewsID: ${group.newsId}`);
        }

        // 2. Check available news articles
        console.log('\n2. AVAILABLE NEWS ARTICLES:');
        const allNews = await News.find().limit(5);
        console.log(`   Found ${allNews.length} news articles`);
        
        for (const news of allNews) {
            console.log(`   News: "${news.title?.substring(0, 50)}..." -> ID: ${news._id}`);
        }

        // 3. Test with a specific newsId that has comment groups
        console.log('\n3. TESTING WITH EXISTING NEWSID:');
        if (allGroups.length > 0) {
            const testNewsId = allGroups[0].newsId;
            console.log(`   Testing with newsId: ${testNewsId}`);
            
            const testGroups = await CommentGroup.find({ 
                newsId: testNewsId, 
                comments: { $ne: [] } 
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            });
            
            console.log(`   Found ${testGroups.length} groups for this newsId`);
            
            if (testGroups.length > 0) {
                const group = testGroups[0];
                console.log(`   Sample group: "${group.label}"`);
                console.log(`   Comments: ${group.comments.length}`);
                
                if (group.comments.length > 0) {
                    const comment = group.comments[0];
                    console.log(`   Sample comment text: "${comment.comment?.substring(0, 50)}..."`);
                    console.log(`   Sample comment user: ${comment.commenter?.username}`);
                }
            }
        }

        // 4. Test the service with the correct newsId
        console.log('\n4. TESTING SERVICE WITH CORRECT NEWSID:');
        if (allGroups.length > 0) {
            const commentFilteringService = require('./services/commentFilteringService');
            const testNewsId = allGroups[0].newsId;
            
            try {
                const serviceResult = await commentFilteringService.getGroupedComments(testNewsId);
                console.log(`   Service returned ${serviceResult.length} groups`);
                
                if (serviceResult.length > 0) {
                    const firstGroup = serviceResult[0];
                    console.log(`   First group: "${firstGroup.label}"`);
                    console.log(`   Comments: ${firstGroup.commentCount}`);
                    
                    if (firstGroup.comments && firstGroup.comments.length > 0) {
                        const firstComment = firstGroup.comments[0];
                        console.log(`   First comment:`, {
                            text: firstComment.text?.substring(0, 50) + '...',
                            username: firstComment.username,
                            commentType: firstComment.commentType
                        });
                        
                        console.log('\n   ✅ SERVICE WORKING CORRECTLY!');
                        console.log('   The issue was using the wrong newsId for testing');
                    }
                }
            } catch (serviceError) {
                console.error('   Service error:', serviceError.message);
            }
        }

    } catch (error) {
        console.error('❌ Check error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the check
checkNewsIdAssociation();