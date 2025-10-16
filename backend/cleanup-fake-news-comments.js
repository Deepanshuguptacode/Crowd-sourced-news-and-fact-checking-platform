const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { CommunityComment } = require('./models/Comments');
const { CommentGroup, CommentFilter } = require('./models/CommentFilter');

async function cleanupFakeNewsCommentsWithoutVotes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        console.log('\n🧹 CLEANING UP FAKE NEWS COMMENTS WITHOUT EXPERT VOTES\n');

        // Get all fake news IDs
        const fakeNewsIds = [
            "68ef91ef3bda87128d26e22c",
            "68ef91ef3bda87128d26e22e", 
            "68ef91ef3bda87128d26e232",
            "68ef91ef3bda87128d26e234",
            "68ef91ef3bda87128d26e236",
            "68ef91ef3bda87128d26e238",
            "68ef91ef3bda87128d26e23a",
            "68ef91ef3bda87128d26e23c",
            "68ef91ef3bda87128d26e23e",
            "68ef91ef3bda87128d26e240"
        ];

        console.log('📊 INITIAL ANALYSIS:');
        
        // Check current state
        const totalComments = await CommunityComment.countDocuments({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) }
        });
        
        const commentsWithoutVotes = await CommunityComment.find({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) },
            $or: [
                { expertVotes: { $exists: false } },
                { expertVotes: { $size: 0 } }
            ]
        });

        const commentsWithVotes = await CommunityComment.find({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) },
            expertVotes: { $exists: true, $ne: [] }
        });

        console.log(`   Total fake news comments: ${totalComments}`);
        console.log(`   Comments WITHOUT expert votes: ${commentsWithoutVotes.length}`);
        console.log(`   Comments WITH expert votes: ${commentsWithVotes.length}`);

        if (commentsWithoutVotes.length === 0) {
            console.log('\n✅ No comments without expert votes found. Nothing to clean up!');
            return;
        }

        // Get IDs of comments to delete
        const commentIdsToDelete = commentsWithoutVotes.map(c => c._id);
        
        console.log('\n🗑️  DELETION PROCESS:');
        console.log(`   Will delete ${commentIdsToDelete.length} comments without expert votes`);

        // Find and delete related comment groups
        console.log('\n1. Finding comment groups that contain comments without votes...');
        
        const groupsToUpdate = await CommentGroup.find({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) },
            comments: { $in: commentIdsToDelete }
        });

        console.log(`   Found ${groupsToUpdate.length} groups that need updating`);

        let groupsDeleted = 0;
        let groupsUpdated = 0;

        for (const group of groupsToUpdate) {
            // Remove comments without votes from the group
            const remainingComments = group.comments.filter(
                commentId => !commentIdsToDelete.some(deleteId => deleteId.equals(commentId))
            );

            if (remainingComments.length === 0) {
                // Delete empty group
                await CommentGroup.findByIdAndDelete(group._id);
                groupsDeleted++;
                console.log(`   🗑️  Deleted empty group: "${group.label}"`);
            } else {
                // Update group with remaining comments
                await CommentGroup.findByIdAndUpdate(group._id, {
                    comments: remainingComments,
                    commentCount: remainingComments.length
                });
                groupsUpdated++;
                console.log(`   ✏️  Updated group "${group.label}": ${group.comments.length} → ${remainingComments.length} comments`);
            }
        }

        // Find and delete related comment filters
        console.log('\n2. Finding and deleting comment filters...');
        
        const filtersToDelete = await CommentFilter.find({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) },
            originalCommentId: { $in: commentIdsToDelete }
        });

        console.log(`   Found ${filtersToDelete.length} filters to delete`);

        if (filtersToDelete.length > 0) {
            const deletedFilters = await CommentFilter.deleteMany({
                newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) },
                originalCommentId: { $in: commentIdsToDelete }
            });
            console.log(`   🗑️  Deleted ${deletedFilters.deletedCount} comment filters`);
        }

        // Delete the comments without expert votes
        console.log('\n3. Deleting comments without expert votes...');
        
        const deletedComments = await CommunityComment.deleteMany({
            _id: { $in: commentIdsToDelete }
        });

        console.log(`   🗑️  Deleted ${deletedComments.deletedCount} comments`);

        // Final verification
        console.log('\n✅ CLEANUP COMPLETE - VERIFICATION:');
        
        const finalCommentCount = await CommunityComment.countDocuments({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) }
        });

        const finalCommentsWithoutVotes = await CommunityComment.countDocuments({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) },
            $or: [
                { expertVotes: { $exists: false } },
                { expertVotes: { $size: 0 } }
            ]
        });

        const finalGroupCount = await CommentGroup.countDocuments({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) }
        });

        const finalFilterCount = await CommentFilter.countDocuments({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) }
        });

        console.log(`   📊 Final fake news comments: ${finalCommentCount}`);
        console.log(`   📊 Comments without votes remaining: ${finalCommentsWithoutVotes}`);
        console.log(`   📊 Final comment groups: ${finalGroupCount}`);
        console.log(`   📊 Final comment filters: ${finalFilterCount}`);

        // Summary
        console.log('\n📈 CLEANUP SUMMARY:');
        console.log(`   🗑️  Comments deleted: ${deletedComments.deletedCount}`);
        console.log(`   🗑️  Comment groups deleted: ${groupsDeleted}`);
        console.log(`   ✏️  Comment groups updated: ${groupsUpdated}`);
        console.log(`   🗑️  Comment filters deleted: ${filtersToDelete.length}`);

        // Check if we have the expected final count (200 comments with votes)
        const expectedComments = 10 * 20; // 10 articles × 20 comments each
        if (finalCommentCount === expectedComments && finalCommentsWithoutVotes === 0) {
            console.log('\n🎉 SUCCESS: All fake news comments now have expert votes!');
        } else {
            console.log(`\n⚠️  Note: Expected ${expectedComments} comments, found ${finalCommentCount}`);
        }

        // Sample verification - check a few remaining comments
        console.log('\n🔍 SAMPLE VERIFICATION:');
        const sampleComments = await CommunityComment.find({
            newsId: { $in: fakeNewsIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).limit(3).populate('commenter', 'username');

        sampleComments.forEach((comment, index) => {
            console.log(`   ${index + 1}. Comment by ${comment.commenter?.username}: ${comment.expertVotes?.length || 0} expert votes`);
        });

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

cleanupFakeNewsCommentsWithoutVotes();
