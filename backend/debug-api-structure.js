const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const { CommunityComment, ExpertComment } = require('./models/Comments');
const { CommentFilter, CommentGroup } = require('./models/CommentFilter');
const News = require('./models/News');

async function fixBackendAPIDataStructure() {
    try {
        // MongoDB connection
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('\n🔧 FIXING BACKEND API DATA STRUCTURE\n');

        // Test the current backend service logic
        console.log('1. TESTING CURRENT SERVICE LOGIC:');
        
        // Get a sample group and test what data structure it returns
        const sampleGroup = await CommentGroup.findOne({ comments: { $ne: [] } })
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            });

        if (sampleGroup) {
            console.log(`   Sample group: "${sampleGroup.label}"`);
            console.log(`   Comments count: ${sampleGroup.comments.length}`);
            
            if (sampleGroup.comments.length > 0) {
                const comment = sampleGroup.comments[0];
                console.log(`   Comment structure:`, {
                    hasText: !!comment.comment,
                    hasCommenter: !!comment.commenter,
                    commenterUsername: comment.commenter?.username,
                    textPreview: comment.comment?.substring(0, 50) + '...'
                });
            }
        }

        // 2. Create the corrected API response structure
        console.log('\n2. CREATING CORRECTED API RESPONSE:');
        
        const correctedGroups = await CommentGroup.find({ comments: { $ne: [] } })
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            })
            .limit(5);

        const apiResponse = correctedGroups.map(group => ({
            _id: group._id,
            label: group.label,
            description: group.description,
            newsId: group.newsId,
            createdAt: group.createdAt,
            commentCount: group.comments.length,
            comments: group.comments.map(comment => ({
                _id: comment._id,
                text: comment.comment, // Map 'comment' field to 'text' for frontend
                commentType: 'community', // Since these are all community comments
                username: comment.commenter?.username || 'Anonymous', // Flatten username
                userFullName: comment.commenter?.fullName || 'Unknown User',
                createdAt: comment.createdAt
            }))
        }));

        console.log('\n3. CORRECTED API RESPONSE SAMPLE:');
        const firstGroup = apiResponse[0];
        if (firstGroup) {
            console.log(`   Group: "${firstGroup.label}"`);
            console.log(`   Description: "${firstGroup.description}"`);
            console.log(`   Comments: ${firstGroup.commentCount}`);
            
            if (firstGroup.comments.length > 0) {
                const firstComment = firstGroup.comments[0];
                console.log(`   First comment:`, {
                    text: firstComment.text?.substring(0, 50) + '...',
                    username: firstComment.username,
                    commentType: firstComment.commentType
                });
            }
        }

        // 4. Test all groups to ensure data consistency
        console.log('\n4. VALIDATING ALL GROUPS:');
        let totalComments = 0;
        let commentsWithText = 0;
        let commentsWithUsernames = 0;

        apiResponse.forEach(group => {
            group.comments.forEach(comment => {
                totalComments++;
                if (comment.text && comment.text.trim() !== '') {
                    commentsWithText++;
                }
                if (comment.username && comment.username !== 'Anonymous') {
                    commentsWithUsernames++;
                }
            });
        });

        console.log(`   Total comments checked: ${totalComments}`);
        console.log(`   Comments with text: ${commentsWithText}`);
        console.log(`   Comments with usernames: ${commentsWithUsernames}`);
        console.log(`   Text success rate: ${(commentsWithText/totalComments*100).toFixed(1)}%`);
        console.log(`   Username success rate: ${(commentsWithUsernames/totalComments*100).toFixed(1)}%`);

        // 5. Write the corrected service function
        console.log('\n5. GENERATED CORRECTED SERVICE FUNCTION:');
        console.log(`
// Updated getGroupedComments function for commentFilteringService.js
async getGroupedComments(newsId) {
  try {
    const groups = await CommentGroup.find({ newsId, comments: { $ne: [] } })
      .populate({
        path: 'comments',
        populate: {
          path: 'commenter',
          select: 'username fullName'
        }
      })
      .sort({ createdAt: -1 });

    return groups.map(group => ({
      _id: group._id,
      label: group.label,
      description: group.description,
      newsId: group.newsId,
      createdAt: group.createdAt,
      commentCount: group.comments.length,
      comments: group.comments.map(comment => ({
        _id: comment._id,
        text: comment.comment, // Map 'comment' field to 'text' 
        commentType: 'community',
        username: comment.commenter?.username || 'Anonymous',
        userFullName: comment.commenter?.fullName || 'Unknown User',
        createdAt: comment.createdAt
      }))
    }));
  } catch (error) {
    console.error('Error in getGroupedComments:', error);
    throw error;
  }
}
        `);

        console.log('\n✅ SOLUTION IDENTIFIED:');
        console.log('   The backend service needs to be updated to map:');
        console.log('   - comment.comment → comment.text (for frontend)');
        console.log('   - comment.commenter.username → comment.username (flattened)');
        console.log('   - Use direct CommentGroup population instead of CommentFilter logic');

    } catch (error) {
        console.error('❌ Fix error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the fix
fixBackendAPIDataStructure();