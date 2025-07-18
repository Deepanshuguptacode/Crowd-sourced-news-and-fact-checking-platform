const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const DebateRoom = require('./models/DebateRoom');
const DebateGroup = require('./models/DebateGroup');
const DebateComment = require('./models/DebateComment');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/debate-room');

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint without authentication
app.get('/test-debate-room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    console.log('=== Test Frontend Access ===');
    console.log('Room ID:', roomId);
    
    // Get the debate room
    const room = await DebateRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    console.log('Room found:', room.title);
    
    // Get groups with populated data
    const forGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'for' })
      .populate('commentIds')
      .populate('counterGroupId')
      .sort({ displayOrder: 1 });
    
    const againstGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'against' })
      .populate('commentIds')
      .populate('counterGroupId')
      .sort({ displayOrder: 1 });
    
    console.log('FOR groups:', forGroups.length);
    console.log('AGAINST groups:', againstGroups.length);
    
    // Log counter-linking
    forGroups.forEach(group => {
      console.log(`FOR ${group.title} -> ${group.counterGroupId?.title || 'None'}`);
    });
    
    againstGroups.forEach(group => {
      console.log(`AGAINST ${group.title} -> ${group.counterGroupId?.title || 'None'}`);
    });
    
    // Test thread creation
    const threads = [];
    const processedConGroups = new Set();
    
    forGroups.forEach(proGroup => {
      const thread = { pro: proGroup, con: null };
      
      if (proGroup.counterGroupId) {
        const counterGroup = againstGroups.find(g => 
          g._id.toString() === proGroup.counterGroupId._id.toString()
        );
        if (counterGroup) {
          thread.con = counterGroup;
          processedConGroups.add(counterGroup._id.toString());
        }
      }
      
      threads.push(thread);
    });
    
    // Add remaining con groups
    againstGroups.forEach(conGroup => {
      if (!processedConGroups.has(conGroup._id.toString())) {
        threads.push({ pro: null, con: conGroup });
      }
    });
    
    console.log('Threads created:', threads.length);
    
    const response = {
      success: true,
      data: {
        room,
        groups: { for: forGroups, against: againstGroups },
        threads,
        stats: {
          forGroups: forGroups.length,
          againstGroups: againstGroups.length,
          totalThreads: threads.length,
          linkedGroups: forGroups.filter(g => g.counterGroupId).length + againstGroups.filter(g => g.counterGroupId).length
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start test server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test URL: http://localhost:${PORT}/test-debate-room/687940c60b3d629265f75430`);
});
