const mongoose = require('mongoose');
const { CommentGroup } = require('./models/CommentFilter');
const { CommunityComment } = require('./models/Comments');
const commentFilteringService = require('./services/commentFilteringService');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://rishiraj:rishibbs@voxveritas.rldvf.mongodb.net/VoxVeritas?retryWrites=true&w=majority&appName=VoxVeritas';

async function verifyFrontendFix() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB Atlas successfully\n');

        console.log('🔧 VERIFYING FRONTEND FIX - COMMENT TEXT AND USERNAMES\n');

        // Get a valid newsId with comments
        const sampleGroup = await CommentGroup.findOne({ comments: { $exists: true, $ne: [] } });
        const newsId = sampleGroup.newsId.toString();
        
        console.log(`1. TESTING WITH NEWSID: ${newsId}`);
        console.log(`   Sample group: "${sampleGroup.label}"`);
        console.log(`   Comments count: ${sampleGroup.comments.length}\n`);

        // Test the service (simulating API call)
        console.log('2. API SERVICE RESPONSE:');
        const groups = await commentFilteringService.getGroupedComments(newsId);
        
        if (!groups || groups.length === 0) {
            console.log('   ❌ No groups returned');
            return;
        }

        console.log(`   Found ${groups.length} groups\n`);

        // Check first group with comments
        let testGroup = null;
        for (const group of groups) {
            if (group.comments && group.comments.length > 0) {
                testGroup = group;
                break;
            }
        }

        if (!testGroup) {
            console.log('   ❌ No groups with comments found');
            return;
        }

        console.log('3. DETAILED GROUP ANALYSIS:');
        console.log(`   Group: "${testGroup.label}"`);
        console.log(`   Total comments: ${testGroup.comments.length}`);
        console.log('   Comment structure check:');

        // Check all comments in the group
        let validComments = 0;
        let invalidComments = 0;

        testGroup.comments.forEach((comment, index) => {
            const hasText = comment.text && comment.text.trim().length > 0;
            const hasUsername = comment.username && comment.username.trim().length > 0;
            
            if (hasText && hasUsername) {
                validComments++;
                if (index < 3) { // Show first 3 comments as examples
                    console.log(`   
   Comment ${index + 1}:
     ✅ Text: "${comment.text.substring(0, 50)}${comment.text.length > 50 ? '...' : ''}"
     ✅ Username: "${comment.username}"
     ✅ Type: "${comment.commentType}"`);
                }
            } else {
                invalidComments++;
                console.log(`   ❌ Comment ${index + 1}: Missing ${!hasText ? 'text' : ''} ${!hasUsername ? 'username' : ''}`);
            }
        });

        console.log(`\n4. VALIDATION SUMMARY:`);
        console.log(`   ✅ Valid comments: ${validComments}`);
        console.log(`   ❌ Invalid comments: ${invalidComments}`);
        console.log(`   Success rate: ${((validComments / (validComments + invalidComments)) * 100).toFixed(1)}%`);

        if (validComments === testGroup.comments.length) {
            console.log('\n🎉 FRONTEND FIX VERIFIED SUCCESSFULLY!');
            console.log('   - All comments have text content');
            console.log('   - All comments have usernames');
            console.log('   - API returns data in correct format for frontend');
        } else {
            console.log('\n⚠️  Some comments still have issues');
        }

        // Test multiple groups
        console.log('\n5. TESTING MULTIPLE GROUPS:');
        let totalValidComments = 0;
        let totalComments = 0;
        let groupsWithComments = 0;

        for (const group of groups) {
            if (group.comments && group.comments.length > 0) {
                groupsWithComments++;
                group.comments.forEach(comment => {
                    totalComments++;
                    if (comment.text && comment.text.trim() && comment.username && comment.username.trim()) {
                        totalValidComments++;
                    }
                });
            }
        }

        console.log(`   Groups with comments: ${groupsWithComments}`);
        console.log(`   Total comments across all groups: ${totalComments}`);
        console.log(`   Comments with text and username: ${totalValidComments}`);
        console.log(`   Overall success rate: ${((totalValidComments / totalComments) * 100).toFixed(1)}%`);

        if (totalValidComments === totalComments) {
            console.log('\n🚀 COMPLETE SUCCESS - FRONTEND INTEGRATION READY!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

verifyFrontendFix();