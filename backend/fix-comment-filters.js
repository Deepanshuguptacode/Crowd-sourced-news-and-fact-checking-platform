const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const News = require('./models/News');
const { CommunityComment } = require('./models/Comments');
const { CommentGroup, CommentFilter } = require('./models/CommentFilter');

class CommentFilterFix {
    async initialize() {
        try {
            const mongoUri = process.env.MONGODB_URI;
            await mongoose.connect(mongoUri);
            console.log('✅ Connected to MongoDB Atlas successfully');
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            return false;
        }
    }

    async fixCommentFilters() {
        console.log('🔧 FIXING COMMENT FILTERS FOR INSERTED COMMENTS\n');

        try {
            // Get all inserted comments (recent ones)
            const recentComments = await CommunityComment.find({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            }).populate('newsId');

            console.log(`📋 Found ${recentComments.length} recent comments to process`);

            // Get all comment groups
            const allGroups = await CommentGroup.find({});
            console.log(`📦 Found ${allGroups.length} comment groups`);

            // Delete existing filters to avoid duplicates
            await CommentFilter.deleteMany({});
            console.log('🗑️  Cleared existing comment filters');

            let filtersCreated = 0;

            for (const comment of recentComments) {
                try {
                    // Find which group this comment belongs to
                    const parentGroup = allGroups.find(group => 
                        group.comments.includes(comment._id)
                    );

                    if (parentGroup) {
                        const filter = new CommentFilter({
                            text: comment.comment,                    // Required field
                            originalCommentId: comment._id,           // Required field  
                            commentType: 'community',                 // Required field
                            newsId: comment.newsId._id,
                            groupId: parentGroup._id,
                            embedding: [],
                            createdAt: new Date()
                        });

                        await filter.save();
                        filtersCreated++;

                        if (filtersCreated % 10 === 0) {
                            console.log(`   ✅ Created ${filtersCreated} filters...`);
                        }
                    } else {
                        console.log(`   ⚠️  No group found for comment: ${comment._id}`);
                    }
                } catch (error) {
                    console.error(`   ❌ Error creating filter for comment ${comment._id}:`, error.message);
                }
            }

            console.log(`\n🎉 COMMENT FILTER FIX COMPLETE!`);
            console.log(`📊 Created ${filtersCreated} comment filters`);

            // Verify the fix
            const totalFilters = await CommentFilter.countDocuments();
            const totalComments = recentComments.length;
            const totalGroups = allGroups.length;

            console.log(`\n📊 VERIFICATION:`);
            console.log(`   💬 Recent comments: ${totalComments}`);
            console.log(`   📦 Comment groups: ${totalGroups}`);
            console.log(`   🔗 Comment filters: ${totalFilters}`);
            console.log(`   ✅ Success rate: ${((totalFilters / totalComments) * 100).toFixed(1)}%`);

            return {
                commentsProcessed: totalComments,
                filtersCreated: totalFilters,
                groupsAvailable: totalGroups
            };

        } catch (error) {
            console.error('❌ Error fixing comment filters:', error);
            return null;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    async function main() {
        const fixer = new CommentFilterFix();
        if (await fixer.initialize()) {
            await fixer.fixCommentFilters();
        }
        await mongoose.connection.close();
        console.log('📁 Database connection closed');
    }
    
    main().catch(console.error);
}

module.exports = CommentFilterFix;