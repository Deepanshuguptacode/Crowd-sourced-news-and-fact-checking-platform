const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import models
const DebateRoom = require('./models/DebateRoom');
const DebateGroup = require('./models/DebateGroup');
const DebateComment = require('./models/DebateComment');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/debate-room');

// Create Express app for testing
const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint to get rooms without authentication
app.get('/test-rooms', async (req, res) => {
  try {
    const rooms = await DebateRoom.find({});
    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to get groups for a room
app.get('/test-rooms/:roomId/groups', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const forGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'for' })
      .populate('commentIds')
      .populate('counterGroupId')
      .sort({ displayOrder: 1 });
    
    const againstGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'against' })
      .populate('commentIds')
      .populate('counterGroupId')
      .sort({ displayOrder: 1 });

    console.log(`Test API - Found ${forGroups.length} FOR groups and ${againstGroups.length} AGAINST groups`);
    
    // Log counter-group data
    forGroups.forEach(group => {
      console.log(`FOR Group: ${group.title}, counterGroupId: ${group.counterGroupId ? group.counterGroupId.title : 'None'}`);
    });
    againstGroups.forEach(group => {
      console.log(`AGAINST Group: ${group.title}, counterGroupId: ${group.counterGroupId ? group.counterGroupId.title : 'None'}`);
    });

    res.json({
      success: true,
      data: { 
        for: forGroups, 
        against: againstGroups 
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start test server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test API server running on port ${PORT}`);
  console.log(`Test endpoints:`);
  console.log(`- GET http://localhost:${PORT}/test-rooms`);
  console.log(`- GET http://localhost:${PORT}/test-rooms/:roomId/groups`);
});
