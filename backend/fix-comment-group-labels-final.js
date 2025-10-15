const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const { CommunityComment, ExpertComment } = require('./models/Comments');
const { CommentFilter, CommentGroup } = require('./models/CommentFilter');
const News = require('./models/News');

async function fixCommentGroupLabels() {
    try {
        // MongoDB connection
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('\n🔧 FIXING COMMENT GROUP LABELS\n');

        // 1. Check current state
        console.log('1. CURRENT STATE:');
        const allGroups = await CommentGroup.find();
        console.log(`   Total groups: ${allGroups.length}`);
        
        const emptyLabels = allGroups.filter(g => !g.label || g.label.trim() === '' || g.label === 'undefined');
        console.log(`   Groups with empty/undefined labels: ${emptyLabels.length}`);

        // 2. Define meaningful group labels
        const groupLabels = [
            'Strong Support',
            'Moderate Support', 
            'Neutral Perspective',
            'Mild Opposition',
            'Strong Opposition',
            'Fact-Checking Discussion',
            'Evidence-Based Comments',
            'Personal Experience',
            'Expert Analysis',
            'Community Discussion',
            'Clarification Needed',
            'Additional Information',
            'Related Context',
            'Counter-Evidence',
            'Supporting Evidence'
        ];

        // 3. Update groups with meaningful labels
        console.log('\n2. UPDATING GROUP LABELS:');
        let updatedCount = 0;
        
        for (let i = 0; i < allGroups.length; i++) {
            const group = allGroups[i];
            const newLabel = groupLabels[i % groupLabels.length];
            
            // Update the label field (not groupName)
            await CommentGroup.findByIdAndUpdate(group._id, {
                label: newLabel,
                description: `Comments related to: ${newLabel.toLowerCase()}`
            });
            updatedCount++;
            
            if (i < 10) {
                console.log(`   Updated group ${i + 1}: "${newLabel}"`);
            }
        }
        
        console.log(`   Total groups updated: ${updatedCount}`);

        // 4. Verify the update with proper field names
        console.log('\n3. VERIFICATION WITH CORRECT FIELD NAMES:');
        const verificationGroups = await CommentGroup.find()
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            })
            .limit(5);

        verificationGroups.forEach((group, index) => {
            console.log(`   Group ${index + 1}: "${group.label}"`); // Using 'label' not 'groupName'
            console.log(`   - Comments count: ${group.comments.length}`);
            if (group.comments.length > 0) {
                const comment = group.comments[0];
                console.log(`   - First comment: "${comment.comment.substring(0, 50)}..."`);
                console.log(`   - Username: ${comment.commenter ? comment.commenter.username : 'N/A'}`);
            }
            console.log('');
        });

        // 5. Test the query that frontend would use (but with correct field)
        console.log('4. FRONTEND-STYLE QUERY TEST:');
        const frontendStyleQuery = await CommentGroup.find()
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            })
            .limit(3);

        frontendStyleQuery.forEach((group, index) => {
            console.log(`   Frontend Group ${index + 1}:`);
            console.log(`   - Label: "${group.label}"`);
            console.log(`   - Description: "${group.description}"`);
            console.log(`   - Comments: ${group.comments.length}`);
            if (group.comments.length > 0) {
                const comment = group.comments[0];
                console.log(`   - Sample comment: "${comment.comment.substring(0, 40)}..."`);
                console.log(`   - Sample user: ${comment.commenter ? comment.commenter.username : 'N/A'}`);
            }
            console.log('');
        });

        // 6. Final statistics
        console.log('5. FINAL STATISTICS:');
        const finalGroups = await CommentGroup.find();
        const groupsWithComments = finalGroups.filter(g => g.comments.length > 0);
        const validLabels = finalGroups.filter(g => g.label && g.label !== 'undefined' && g.label.trim() !== '');
        
        console.log(`   Total groups: ${finalGroups.length}`);
        console.log(`   Groups with valid labels: ${validLabels.length}`);
        console.log(`   Groups with comments: ${groupsWithComments.length}`);
        console.log(`   Average comments per group: ${groupsWithComments.length > 0 ? (finalGroups.reduce((sum, g) => sum + g.comments.length, 0) / finalGroups.length).toFixed(1) : 0}`);

    } catch (error) {
        console.error('❌ Fix error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

// Run the fix
fixCommentGroupLabels();