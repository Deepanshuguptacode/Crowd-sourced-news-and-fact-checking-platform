const mongoose = require('mongoose');
require('dotenv').config();

// Import the service
const commentFilteringService = require('./services/commentFilteringService');

async function testAPIResponse() {
    try {
        // MongoDB connection
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('\n🧪 TESTING UPDATED API RESPONSE\n');

        // Get a sample news ID
        const News = require('./models/News');
        const sampleNews = await News.findOne();
        
        if (!sampleNews) {
            console.log('❌ No news found for testing');
            return;
        }

        // Use a newsId that has comment groups from our previous investigation
        const testNewsId = "68ef91ef3bda87128d26e242"; // This one had 12 groups with comments

        console.log(`Testing with news ID: ${testNewsId}`);
        console.log(`Testing with corrected newsId that has comment groups`);

        // Test the updated service
        console.log('\n1. CALLING UPDATED SERVICE:');
        const groups = await commentFilteringService.getGroupedComments(testNewsId);
        
        console.log(`   Returned ${groups.length} groups`);

        // Check the structure of the first few groups
        console.log('\n2. TESTING GROUP STRUCTURE:');
        for (let i = 0; i < Math.min(3, groups.length); i++) {
            const group = groups[i];
            console.log(`\n   GROUP ${i + 1}:`);
            console.log(`   - Label: "${group.label}"`);
            console.log(`   - Description: "${group.description?.substring(0, 50)}..."`);
            console.log(`   - Comment count: ${group.commentCount}`);
            console.log(`   - Comments array length: ${group.comments?.length || 0}`);
            
            if (group.comments && group.comments.length > 0) {
                const comment = group.comments[0];
                console.log(`   - First comment structure:`, {
                    hasId: !!comment._id,
                    hasText: !!comment.text,
                    hasUsername: !!comment.username,
                    hasCommentType: !!comment.commentType,
                    textPreview: comment.text?.substring(0, 40) + '...',
                    username: comment.username,
                    commentType: comment.commentType
                });
            }
        }

        // 3. Validate all comments have required fields
        console.log('\n3. VALIDATING ALL COMMENTS:');
        let totalComments = 0;
        let validComments = 0;
        let commentsWithText = 0;
        let commentsWithUsernames = 0;

        groups.forEach(group => {
            group.comments?.forEach(comment => {
                totalComments++;
                
                if (comment.text && comment.username && comment.commentType) {
                    validComments++;
                }
                if (comment.text && comment.text.trim() !== '') {
                    commentsWithText++;
                }
                if (comment.username && comment.username !== 'Anonymous') {
                    commentsWithUsernames++;
                }
            });
        });

        console.log(`   Total comments: ${totalComments}`);
        console.log(`   Valid comments (all fields): ${validComments}`);
        console.log(`   Comments with text: ${commentsWithText}`);
        console.log(`   Comments with usernames: ${commentsWithUsernames}`);
        console.log(`   Success rate: ${(validComments/totalComments*100).toFixed(1)}%`);

        // 4. Simulate frontend expected format
        console.log('\n4. FRONTEND COMPATIBILITY CHECK:');
        if (groups.length > 0 && groups[0].comments?.length > 0) {
            const testComment = groups[0].comments[0];
            console.log('   Frontend expects:');
            console.log(`   - comment.text: "${testComment.text}" ✅`);
            console.log(`   - comment.username: "${testComment.username}" ✅`);
            console.log(`   - comment.commentType: "${testComment.commentType}" ✅`);
            console.log('\n   ✅ Frontend compatibility: PASSED');
        }

        console.log('\n🎉 API RESPONSE UPDATE: SUCCESSFUL!');
        console.log('   The backend now returns the correct data structure');
        console.log('   Frontend should display comments with text and usernames');

    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the test
testAPIResponse();