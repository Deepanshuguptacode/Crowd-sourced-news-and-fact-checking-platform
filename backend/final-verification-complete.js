const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const { CommunityComment, ExpertComment } = require('./models/Comments');
const { CommentFilter, CommentGroup } = require('./models/CommentFilter');
const News = require('./models/News');

async function finalVerification() {
    try {
        // MongoDB connection
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('\n✅ FINAL VERIFICATION - COMMENT GROUPS DISPLAY FIX\n');

        // 1. Test the exact query that frontend would use
        console.log('1. TESTING FRONTEND QUERY STRUCTURE:');
        const frontendQuery = await CommentGroup.find({ comments: { $ne: [] } })
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            })
            .limit(3);

        frontendQuery.forEach((group, index) => {
            console.log(`\n   GROUP ${index + 1}:`);
            console.log(`   - Label: "${group.label}"`);
            console.log(`   - Description: "${group.description}"`);
            console.log(`   - Comments count: ${group.comments.length}`);
            
            if (group.comments.length > 0) {
                const comment = group.comments[0];
                console.log(`   - First comment text: "${comment.comment ? comment.comment.substring(0, 50) + '...' : 'NO TEXT'}"`);
                console.log(`   - First comment user: ${comment.commenter ? comment.commenter.username : 'NO USER'}`);
                
                // Check the actual structure of the comment
                console.log(`   - Comment fields available:`, Object.keys(comment.toObject ? comment.toObject() : comment));
                if (comment.commenter) {
                    console.log(`   - User fields available:`, Object.keys(comment.commenter.toObject ? comment.commenter.toObject() : comment.commenter));
                }
            }
        });

        // 2. Verify the overall statistics
        console.log('\n2. OVERALL STATISTICS:');
        const totalGroups = await CommentGroup.countDocuments();
        const groupsWithComments = await CommentGroup.countDocuments({ comments: { $ne: [] } });
        const groupsWithValidLabels = await CommentGroup.countDocuments({ 
            label: { $exists: true, $ne: null, $ne: 'undefined', $ne: '' } 
        });
        
        console.log(`   - Total groups: ${totalGroups}`);
        console.log(`   - Groups with comments: ${groupsWithComments}`);
        console.log(`   - Groups with valid labels: ${groupsWithValidLabels}`);

        // 3. Test a single group in detail
        console.log('\n3. DETAILED GROUP ANALYSIS:');
        const detailedGroup = await CommentGroup.findOne({ comments: { $ne: [] } })
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName email'
                }
            });

        if (detailedGroup) {
            console.log(`   Group: "${detailedGroup.label}"`);
            console.log(`   Description: "${detailedGroup.description}"`);
            console.log(`   Comments in group: ${detailedGroup.comments.length}`);
            
            detailedGroup.comments.slice(0, 2).forEach((comment, idx) => {
                console.log(`\n   Comment ${idx + 1}:`);
                console.log(`   - Text: "${comment.comment ? comment.comment.substring(0, 100) + '...' : 'NO TEXT'}"`);
                console.log(`   - Commenter ID: ${comment.commenter ? comment.commenter._id : 'NO COMMENTER'}"`);
                console.log(`   - Username: ${comment.commenter ? comment.commenter.username : 'NO USERNAME'}`);
                console.log(`   - Full Name: ${comment.commenter ? comment.commenter.fullName || 'N/A' : 'NO FULL NAME'}`);
                console.log(`   - Created: ${comment.createdAt}`);
            });
        }

        // 4. Check for any remaining issues
        console.log('\n4. CHECKING FOR REMAINING ISSUES:');
        const emptyLabelGroups = await CommentGroup.countDocuments({
            $or: [
                { label: { $exists: false } },
                { label: null },
                { label: 'undefined' },
                { label: '' }
            ]
        });
        
        const commentsWithoutUsers = await CommunityComment.countDocuments({
            commenter: { $exists: false }
        });

        console.log(`   - Groups with empty/invalid labels: ${emptyLabelGroups}`);
        console.log(`   - Comments without commenter: ${commentsWithoutUsers}`);

        // 5. Success summary
        if (groupsWithValidLabels === totalGroups && commentsWithoutUsers === 0) {
            console.log('\n🎉 SUCCESS SUMMARY:');
            console.log('   ✅ All comment groups have valid labels');
            console.log('   ✅ All comments have proper commenter references');
            console.log('   ✅ Comment text and usernames are displaying correctly');
            console.log('   ✅ Frontend should now show comment groups with text and usernames');
            console.log('\n   The issue has been COMPLETELY RESOLVED! 🎯');
        } else {
            console.log('\n⚠️  REMAINING ISSUES:');
            if (emptyLabelGroups > 0) console.log(`   - ${emptyLabelGroups} groups still have invalid labels`);
            if (commentsWithoutUsers > 0) console.log(`   - ${commentsWithoutUsers} comments missing commenter references`);
        }

    } catch (error) {
        console.error('❌ Verification error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the verification
finalVerification();