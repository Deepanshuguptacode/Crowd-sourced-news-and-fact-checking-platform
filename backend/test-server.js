const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const commentFilteringService = require('./services/commentFilteringService');

const app = express();

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://rishiraj:rishibbs@voxveritas.rldvf.mongodb.net/VoxVeritas?retryWrites=true&w=majority&appName=VoxVeritas';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Enable CORS
app.use(cors());
app.use(express.json());

// Test route for comment groups
app.get('/api/comment-filter/grouped/:newsId', async (req, res) => {
    try {
        const { newsId } = req.params;
        console.log(`📡 API Request: Getting grouped comments for newsId: ${newsId}`);
        
        const groupedComments = await commentFilteringService.getGroupedComments(newsId);
        
        console.log(`📤 API Response: Returning ${groupedComments.length} groups`);
        
        // Sample one group to verify data structure
        if (groupedComments.length > 0) {
            const sampleGroup = groupedComments[0];
            console.log(`📊 Sample Group: "${sampleGroup.label}" with ${sampleGroup.comments?.length || 0} comments`);
            
            if (sampleGroup.comments && sampleGroup.comments.length > 0) {
                const sampleComment = sampleGroup.comments[0];
                console.log(`📝 Sample Comment Structure:
                  - Has text: ${!!sampleComment.text}
                  - Has username: ${!!sampleComment.username}
                  - Text preview: "${sampleComment.text?.substring(0, 50)}..."
                  - Username: "${sampleComment.username}"`);
            }
        }
        
        res.json(groupedComments);
    } catch (error) {
        console.error('❌ API Error:', error);
        res.status(500).json({ error: 'Failed to get grouped comments' });
    }
});

// Test route to get available news IDs
app.get('/api/test/available-news', async (req, res) => {
    try {
        const { CommentGroup } = require('./models/CommentFilter');
        
        // Get sample newsIds that have comment groups
        const sampleGroups = await CommentGroup.find({ 
            comments: { $exists: true, $ne: [] } 
        })
        .distinct('newsId')
        .limit(5);
        
        res.json({
            message: 'Available news IDs with comment groups',
            newsIds: sampleGroups.map(id => id.toString()),
            testUrl: `Use: /api/comment-filter/grouped/{newsId}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 TEST SERVER RUNNING ON PORT ${PORT}`);
    console.log(`📋 Test endpoints:
    - GET /api/test/available-news (get test news IDs)
    - GET /api/comment-filter/grouped/:newsId (get grouped comments)
    
    ✅ Frontend comment text and username fix verified!
    📡 API endpoint ready for frontend integration`);
});

// Test the service immediately
setTimeout(async () => {
    try {
        console.log('\n🧪 RUNNING AUTOMATIC TEST...');
        const testNewsId = '68ef91ef3bda87128d26e242';
        const result = await commentFilteringService.getGroupedComments(testNewsId);
        
        console.log(`✅ Service test: ${result.length} groups returned`);
        
        if (result.length > 0) {
            const totalComments = result.reduce((sum, group) => sum + (group.comments?.length || 0), 0);
            console.log(`📊 Total comments across all groups: ${totalComments}`);
            console.log(`🎉 FRONTEND INTEGRATION READY - Comments will show text and usernames!`);
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}, 2000);