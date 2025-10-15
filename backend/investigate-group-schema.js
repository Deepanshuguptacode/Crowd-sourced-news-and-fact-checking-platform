const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const CommunityUser = require('./models/CommunityUser');
const ExpertUser = require('./models/ExpertUser');
const { CommunityComment, ExpertComment } = require('./models/Comments');
const { CommentFilter, CommentGroup } = require('./models/CommentFilter');
const News = require('./models/News');

async function investigateAndFixGroups() {
    try {
        // MongoDB connection
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB Atlas successfully');

        console.log('\n🔍 INVESTIGATING COMMENT GROUP SCHEMA\n');

        // 1. Check the actual schema structure of CommentGroup
        console.log('1. RAW COMMENT GROUP DOCUMENT:');
        const rawGroup = await mongoose.connection.db.collection('commentgroups').findOne();
        console.log('   Raw document structure:', JSON.stringify(rawGroup, null, 2));

        // 2. Check what fields the CommentGroup schema expects
        console.log('\n2. COMMENT GROUP SCHEMA FIELDS:');
        const CommentGroupSchema = CommentGroup.schema;
        console.log('   Schema paths:', Object.keys(CommentGroupSchema.paths));

        // 3. Try to manually create a test group with the right structure
        console.log('\n3. CREATING TEST GROUP:');
        const testGroup = await CommentGroup.create({
            groupName: 'Test Support Group',
            newsId: rawGroup.newsId,
            comments: [],
            groupDescription: 'Test group for debugging'
        });
        console.log('   Test group created:', testGroup.groupName);

        // 4. Check if the issue is with the groupName field not being saved properly
        console.log('\n4. UPDATING EXISTING GROUPS MANUALLY:');
        const groupsToUpdate = await CommentGroup.find().limit(5);
        
        for (let i = 0; i < groupsToUpdate.length; i++) {
            const group = groupsToUpdate[i];
            console.log(`   Before update - Group ${i+1}: "${group.groupName}"`);
            
            // Try direct field assignment
            group.groupName = `Manual Group ${i+1}`;
            await group.save();
            
            // Verify the update
            const updatedGroup = await CommentGroup.findById(group._id);
            console.log(`   After update - Group ${i+1}: "${updatedGroup.groupName}"`);
        }

        // 5. Check if there's a different issue with the populate query
        console.log('\n5. TESTING DIFFERENT QUERY APPROACHES:');
        
        // Direct find without populate
        const directGroup = await CommentGroup.findOne().lean();
        console.log('   Direct find (lean):', directGroup ? directGroup.groupName : 'null');
        
        // Find with select
        const selectedGroup = await CommentGroup.findOne().select('groupName comments newsId');
        console.log('   With select:', selectedGroup ? selectedGroup.groupName : 'null');

        // Test the final working query
        console.log('\n6. FINAL TEST QUERY (LIKE FRONTEND):');
        const frontendGroups = await CommentGroup.find()
            .populate({
                path: 'comments',
                populate: {
                    path: 'commenter',
                    select: 'username fullName'
                }
            })
            .limit(3)
            .lean();

        frontendGroups.forEach((group, index) => {
            console.log(`   Group ${index + 1}:`);
            console.log(`   - Name: "${group.groupName}"`);
            console.log(`   - Comments: ${group.comments ? group.comments.length : 0}`);
            if (group.comments && group.comments.length > 0) {
                console.log(`   - First comment: "${group.comments[0].comment?.substring(0, 30)}..."`);
                console.log(`   - First user: ${group.comments[0].commenter?.username || 'N/A'}`);
            }
        });

    } catch (error) {
        console.error('❌ Investigation error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

// Run the investigation
investigateAndFixGroups();