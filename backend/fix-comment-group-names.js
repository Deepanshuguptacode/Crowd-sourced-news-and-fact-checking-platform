const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const { CommunityComment, ExpertComment } = require('./models/Comments');
const { CommentFilter, CommentGroup } = require('./models/CommentFilter');
const News = require('./models/News');

async function fixCommentGroups() {
    try {
        // MongoDB connection
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('\n🔧 FIXING COMMENT GROUP DISPLAY ISSUES\n');

        // 1. Check the current state of comment groups
        console.log('1. CURRENT COMMENT GROUP STATE:');
        const allGroups = await CommentGroup.find();
        console.log(`   Total groups: ${allGroups.length}`);
        
        const groupsWithUndefinedName = allGroups.filter(g => !g.groupName || g.groupName === 'undefined');
        console.log(`   Groups with undefined names: ${groupsWithUndefinedName.length}`);
        
        if (groupsWithUndefinedName.length > 0) {
            console.log('   Sample undefined group:');
            console.log(`   - ID: ${groupsWithUndefinedName[0]._id}`);
            console.log(`   - Group name: "${groupsWithUndefinedName[0].groupName}"`);
            console.log(`   - Comments count: ${groupsWithUndefinedName[0].comments.length}`);
            console.log(`   - News ID: ${groupsWithUndefinedName[0].newsId}`);
        }

        // 2. Let's check the CommentFilter collection to understand the group names
        console.log('\n2. CHECKING COMMENT FILTERS FOR PROPER GROUP NAMES:');
        const sampleFilters = await CommentFilter.find().limit(10);
        console.log(`   Total filters: ${sampleFilters.length}`);
        
        if (sampleFilters.length > 0) {
            console.log('   Sample filter:');
            console.log(`   - Filter name: "${sampleFilters[0].filterName}"`);
            console.log(`   - Group ID: ${sampleFilters[0].commentGroupId}`);
            console.log(`   - Comment ID: ${sampleFilters[0].commentId}`);
        }

        // 3. Fix the group names based on the pattern used in comment creation
        console.log('\n3. FIXING GROUP NAMES:');
        
        // Define the proper group names based on the comment creation pattern
        const groupNames = [
            'Strong Support', 'Moderate Support', 'Neutral/Questioning',
            'Mild Opposition', 'Strong Opposition', 'Fact-Checking',
            'Evidence-Based', 'Personal Experience', 'Expert Opinion',
            'Community Discussion'
        ];

        let fixedCount = 0;
        
        // Get all groups and assign proper names cyclically
        const groupsToFix = await CommentGroup.find().sort({ _id: 1 });
        
        for (let i = 0; i < groupsToFix.length; i++) {
            const group = groupsToFix[i];
            const newGroupName = groupNames[i % groupNames.length];
            
            if (!group.groupName || group.groupName === 'undefined') {
                await CommentGroup.findByIdAndUpdate(group._id, {
                    groupName: newGroupName
                });
                fixedCount++;
            }
        }
        
        console.log(`   Fixed ${fixedCount} groups with undefined names`);

        // 4. Verify the fix
        console.log('\n4. VERIFICATION AFTER FIX:');
        const fixedGroups = await CommentGroup.find()
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            })
            .limit(5);

        fixedGroups.forEach((group, index) => {
            console.log(`   Group ${index + 1}: "${group.groupName}"`);
            console.log(`   - Comments count: ${group.comments.length}`);
            if (group.comments.length > 0) {
                const comment = group.comments[0];
                console.log(`   - First comment text: "${comment.comment.substring(0, 50)}..."`);
                console.log(`   - First comment user: ${comment.commenter ? comment.commenter.username : 'N/A'}`);
            }
            console.log('');
        });

        // 5. Final count verification
        console.log('5. FINAL VERIFICATION:');
        const finalGroups = await CommentGroup.find();
        const validGroups = finalGroups.filter(g => g.groupName && g.groupName !== 'undefined');
        console.log(`   Total groups: ${finalGroups.length}`);
        console.log(`   Groups with valid names: ${validGroups.length}`);
        console.log(`   Groups with comments: ${finalGroups.filter(g => g.comments.length > 0).length}`);

    } catch (error) {
        console.error('❌ Fix error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

// Run the fix
fixCommentGroups();