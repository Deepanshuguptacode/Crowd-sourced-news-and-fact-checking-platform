const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const { CommunityComment, ExpertComment } = require('./models/Comments');
const { CommentFilter, CommentGroup } = require('./models/CommentFilter');
const News = require('./models/News');

async function fixCommentReferences() {
    try {
        // MongoDB connection
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('\n🔧 FIXING COMMENT GROUP REFERENCES\n');

        // 1. Find groups with comments vs groups that populate with comments
        console.log('1. ANALYZING COMMENT DISTRIBUTION:');
        const allGroups = await CommentGroup.find();
        const groupsWithCommentIds = allGroups.filter(g => g.comments.length > 0);
        console.log(`   Groups with comment IDs: ${groupsWithCommentIds.length}`);

        // Check if these comment IDs are valid
        let validCommentRefs = 0;
        let invalidCommentRefs = 0;
        
        for (const group of groupsWithCommentIds.slice(0, 10)) { // Check first 10
            for (const commentId of group.comments) {
                const comment = await CommunityComment.findById(commentId);
                if (comment) {
                    validCommentRefs++;
                } else {
                    invalidCommentRefs++;
                }
            }
        }
        
        console.log(`   Valid comment references (sample): ${validCommentRefs}`);
        console.log(`   Invalid comment references (sample): ${invalidCommentRefs}`);

        // 2. Check if comments have the correct filterGroupId
        console.log('\n2. CHECKING COMMENT FILTER GROUP REFERENCES:');
        const commentsWithGroupId = await CommunityComment.find({ filterGroupId: { $exists: true, $ne: null } });
        console.log(`   Comments with filterGroupId: ${commentsWithGroupId.length}`);

        // 3. Rebuild the comment group relationships
        console.log('\n3. REBUILDING COMMENT GROUP RELATIONSHIPS:');
        
        // Clear all comment arrays first
        await CommentGroup.updateMany({}, { $set: { comments: [] } });
        console.log('   Cleared all comment arrays');

        // Rebuild based on filterGroupId in comments
        const allComments = await CommunityComment.find({ filterGroupId: { $exists: true, $ne: null } });
        console.log(`   Found ${allComments.length} comments with group references`);

        let rebuiltGroups = 0;
        const groupCommentMap = {};

        // Build a map of group to comments
        for (const comment of allComments) {
            if (!groupCommentMap[comment.filterGroupId]) {
                groupCommentMap[comment.filterGroupId] = [];
            }
            groupCommentMap[comment.filterGroupId].push(comment._id);
        }

        // Update each group with its comments
        for (const [groupId, commentIds] of Object.entries(groupCommentMap)) {
            const result = await CommentGroup.findByIdAndUpdate(
                groupId,
                { $set: { comments: commentIds } },
                { new: true }
            );
            if (result) {
                rebuiltGroups++;
            }
        }

        console.log(`   Rebuilt ${rebuiltGroups} groups with comments`);

        // 4. Verify the rebuild
        console.log('\n4. VERIFICATION AFTER REBUILD:');
        const rebuiltGroupsCheck = await CommentGroup.find()
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            })
            .limit(5);

        rebuiltGroupsCheck.forEach((group, index) => {
            console.log(`   Group ${index + 1}: "${group.label}"`);
            console.log(`   - Comments count: ${group.comments.length}`);
            if (group.comments.length > 0) {
                const comment = group.comments[0];
                console.log(`   - First comment: "${comment.comment.substring(0, 50)}..."`);
                console.log(`   - Username: ${comment.commenter ? comment.commenter.username : 'N/A'}`);
            }
            console.log('');
        });

        // 5. Final comprehensive check
        console.log('5. COMPREHENSIVE FINAL CHECK:');
        const finalAllGroups = await CommentGroup.find();
        const finalGroupsWithComments = finalAllGroups.filter(g => g.comments.length > 0);
        
        console.log(`   Total groups: ${finalAllGroups.length}`);
        console.log(`   Groups with comments: ${finalGroupsWithComments.length}`);
        
        // Test population with sample groups that have comments
        const sampleGroupsWithComments = await CommentGroup.find({ comments: { $ne: [] } })
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            })
            .limit(3);

        console.log('\n   SAMPLE POPULATED GROUPS:');
        sampleGroupsWithComments.forEach((group, index) => {
            console.log(`   Group ${index + 1}: "${group.label}"`);
            console.log(`   - Raw comments array length: ${group.comments.length}`);
            if (group.comments.length > 0 && group.comments[0]) {
                const comment = group.comments[0];
                console.log(`   - Comment text exists: ${!!comment.comment}`);
                console.log(`   - Comment text: "${comment.comment ? comment.comment.substring(0, 40) + '...' : 'N/A'}"`);
                console.log(`   - Commenter exists: ${!!comment.commenter}`);
                console.log(`   - Username: ${comment.commenter ? comment.commenter.username : 'N/A'}`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('❌ Fix error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

// Run the fix
fixCommentReferences();