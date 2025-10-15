const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const { CommunityComment, ExpertComment } = require('./models/Comments');
const { CommentFilter, CommentGroup } = require('./models/CommentFilter');
const News = require('./models/News');

async function debugCommentDisplay() {
    try {
        // MongoDB connection
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('\n🔍 DEBUGGING COMMENT DISPLAY ISSUE\n');

        // 1. Check a comment group with proper population
        console.log('1. COMMENT GROUP WITH FULL POPULATION:');
        const groupWithComments = await CommentGroup.findOne({ comments: { $ne: [] } })
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    model: 'CommunityUser'
                }
            });

        if (groupWithComments) {
            console.log(`   Group: "${groupWithComments.groupName}"`);
            console.log(`   Total comments: ${groupWithComments.comments.length}`);
            
            if (groupWithComments.comments.length > 0) {
                const firstComment = groupWithComments.comments[0];
                console.log('\n   FIRST COMMENT DETAILS:');
                console.log(`   - Comment ID: ${firstComment._id}`);
                console.log(`   - Comment text: "${firstComment.comment.substring(0, 50)}..."`);
                console.log(`   - Commenter populated: ${firstComment.commenter ? 'YES' : 'NO'}`);
                
                if (firstComment.commenter) {
                    console.log(`   - Username: ${firstComment.commenter.username}`);
                    console.log(`   - Full name: ${firstComment.commenter.fullName || 'N/A'}`);
                    console.log(`   - User type: Community User`);
                } else {
                    console.log('   - Commenter is null or undefined!');
                }
                
                console.log(`   - Created at: ${firstComment.createdAt}`);
            }
        }

        // 2. Check if there are any expert comments that might be causing issues
        console.log('\n2. CHECKING FOR EXPERT COMMENTS:');
        const expertComments = await CommunityComment.find().populate('commenter');
        const expertCommentCount = expertComments.filter(comment => 
            comment.commenter && comment.commenter.constructor.modelName === 'ExpertUser'
        ).length;
        console.log(`   Expert comments found: ${expertCommentCount}`);

        // 3. Sample multiple comments to verify structure
        console.log('\n3. SAMPLE COMMENT VERIFICATION:');
        const sampleComments = await CommunityComment.find().limit(5).populate('commenter');
        
        sampleComments.forEach((comment, index) => {
            console.log(`   Comment ${index + 1}:`);
            console.log(`   - Has text: ${comment.comment ? 'YES' : 'NO'}`);
            console.log(`   - Text length: ${comment.comment ? comment.comment.length : 0}`);
            console.log(`   - Commenter populated: ${comment.commenter ? 'YES' : 'NO'}`);
            if (comment.commenter) {
                console.log(`   - Username: ${comment.commenter.username}`);
            }
            console.log('');
        });

        // 4. Check for any comments with missing fields
        console.log('4. CHECKING FOR PROBLEMATIC COMMENTS:');
        const allComments = await CommunityComment.find();
        const missingText = allComments.filter(c => !c.comment || c.comment.trim() === '');
        const missingCommenter = allComments.filter(c => !c.commenter);
        
        console.log(`   Comments missing text: ${missingText.length}`);
        console.log(`   Comments missing commenter: ${missingCommenter.length}`);
        console.log(`   Total comments: ${allComments.length}`);

        // 5. Test the exact query the frontend might be using
        console.log('\n5. TESTING FRONTEND-STYLE QUERY:');
        const frontendStyleGroups = await CommentGroup.find()
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            })
            .limit(3);

        frontendStyleGroups.forEach((group, index) => {
            console.log(`   Group ${index + 1}: "${group.groupName}"`);
            console.log(`   - Comments count: ${group.comments.length}`);
            if (group.comments.length > 0) {
                const comment = group.comments[0];
                console.log(`   - First comment text exists: ${!!comment.comment}`);
                console.log(`   - First comment user exists: ${!!comment.commenter}`);
                if (comment.commenter) {
                    console.log(`   - Username: ${comment.commenter.username}`);
                }
            }
            console.log('');
        });

    } catch (error) {
        console.error('❌ Debug error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

// Run the debug
debugCommentDisplay();