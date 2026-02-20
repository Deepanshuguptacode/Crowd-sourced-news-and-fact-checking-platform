const mongoose = require('mongoose');
const DebateRoom = require('../models/DebateRoom');
const DebateGroup = require('../models/DebateGroup');
const DebateComment = require('../models/DebateComment');

// Create a new debate room
const createDebateRoom = async (req, res) => {
  try {
    const { title, description, topic, maxParticipants, tags } = req.body;
    
    // Validate user authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!req.userType) {
      return res.status(401).json({
        success: false,
        message: 'User type not identified'
      });
    }

    const creator = req.user._id;
    const creatorModel = req.userType === 'normal' ? 'NormalUser' : 
                        req.userType === 'community' ? 'CommunityUser' : 'ExpertUser';

    console.log('Create debate room request:', { title, creator, creatorModel, userType: req.userType });

    const debateRoom = new DebateRoom({
      title,
      description,
      topic,
      creator,
      creatorModel,
      maxParticipants: maxParticipants || 50,
      tags: tags || [],
      participants: [{
        userId: creator,
        userModel: creatorModel
      }]
    });

    await debateRoom.save();
    
    res.status(201).json({
      success: true,
      message: 'Debate room created successfully',
      data: debateRoom
    });
  } catch (error) {
    console.error('Error creating debate room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create debate room',
      error: error.message
    });
  }
};

// Get all debate rooms
const getAllDebateRooms = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive = true, search } = req.query;
    
    const query = { isActive };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Use raw MongoDB query to avoid validation issues
    const debateRooms = await mongoose.connection.db.collection('debaterooms')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .toArray();

    // Process and clean up the rooms
    const roomsWithStats = await Promise.all(
      debateRooms.map(async (room) => {
        // Ensure participants array exists and is valid
        if (!room.participants) {
          room.participants = [];
        }
        
        // Clean up participants to ensure they have required fields
        room.participants = room.participants.filter(p => p.userId).map(p => ({
          userId: p.userId,
          userModel: p.userModel || 'NormalUser'
        }));

        const participantCount = room.participants.length;
        const commentCount = await DebateComment.countDocuments({ debateRoomId: room._id });
        
        return {
          ...room,
          participantCount,
          commentCount,
          creatorModel: room.creatorModel || 'NormalUser'
        };
      })
    );

    const total = await mongoose.connection.db.collection('debaterooms').countDocuments(query);
    
    res.json({
      success: true,
      data: roomsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching debate rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch debate rooms',
      error: error.message
    });
  }
};

// Get a specific debate room
const getDebateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const debateRoom = await DebateRoom.findById(roomId)
      .populate('creator', 'name email');

    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    // Get comment count
    const commentCount = await DebateComment.countDocuments({ debateRoomId: roomId });

    res.json({
      success: true,
      data: {
        ...debateRoom.toObject(),
        commentCount
      }
    });
  } catch (error) {
    console.error('Error fetching debate room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch debate room',
      error: error.message
    });
  }
};

// Join a debate room
const joinDebateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Validate user authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!req.userType) {
      return res.status(401).json({
        success: false,
        message: 'User type not identified'
      });
    }

    const userId = req.user._id;
    const userModel = req.userType === 'normal' ? 'NormalUser' : 
                     req.userType === 'community' ? 'CommunityUser' : 'ExpertUser';

    console.log('Join debate room request:', { roomId, userId, userModel, userType: req.userType });

    const debateRoom = await DebateRoom.findById(roomId);

    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    if (!debateRoom.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Debate room is not active'
      });
    }

    // Ensure the debate room has the required fields
    if (!debateRoom.creatorModel) {
      debateRoom.creatorModel = 'NormalUser';
    }

    // Initialize participants if it doesn't exist
    if (!debateRoom.participants) {
      debateRoom.participants = [];
    }

    // Check if user is already a participant
    const isParticipant = debateRoom.participants.some(p => {
      if (!p.userId) return false;
      return p.userId.toString() === userId.toString();
    });
    
    if (isParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already a participant in this debate room'
      });
    }

    if (debateRoom.participants.length >= debateRoom.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Debate room is full'
      });
    }

    // Add the new participant
    debateRoom.participants.push({
      userId,
      userModel
    });

    // Validate participants array - ensure all participants have required fields
    debateRoom.participants = debateRoom.participants.map(p => ({
      userId: p.userId,
      userModel: p.userModel || 'NormalUser'
    }));

    await debateRoom.save();

    res.json({
      success: true,
      message: 'Successfully joined the debate room',
      data: debateRoom
    });
  } catch (error) {
    console.error('Error joining debate room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join debate room',
      error: error.message
    });
  }
};

// Leave a debate room
const leaveDebateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const debateRoom = await DebateRoom.findById(roomId);

    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const isParticipant = debateRoom.participants.some(p => p.userId.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant in this debate room'
      });
    }

    debateRoom.participants = debateRoom.participants.filter(
      participant => participant.userId.toString() !== userId.toString()
    );
    await debateRoom.save();

    res.json({
      success: true,
      message: 'Successfully left the debate room',
      data: debateRoom
    });
  } catch (error) {
    console.error('Error leaving debate room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave debate room',
      error: error.message
    });
  }
};

// Update debate room (only by creator)
const updateDebateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const debateRoom = await DebateRoom.findById(roomId);

    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    if (debateRoom.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can update this debate room'
      });
    }

    // Remove fields that shouldn't be updated
    delete updates.creator;
    delete updates.creatorModel;
    delete updates.participants;
    delete updates.createdAt;

    Object.assign(debateRoom, updates);
    await debateRoom.save();

    res.json({
      success: true,
      message: 'Debate room updated successfully',
      data: debateRoom
    });
  } catch (error) {
    console.error('Error updating debate room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update debate room',
      error: error.message
    });
  }
};

// Delete debate room (only by creator)
const deleteDebateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const debateRoom = await DebateRoom.findById(roomId);

    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    if (debateRoom.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete this debate room'
      });
    }

    // Delete all associated comments and groups
    await DebateComment.deleteMany({ debateRoomId: roomId });
    await DebateGroup.deleteMany({ debateRoomId: roomId });
    await DebateRoom.findByIdAndDelete(roomId);

    res.json({
      success: true,
      message: 'Debate room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting debate room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete debate room',
      error: error.message
    });
  }
};

// Regenerate group content (title and description)
const regenerateGroupContent = async (req, res) => {
  try {
    const { roomId, groupId } = req.params;
    const userId = req.user._id;

    const debateRoom = await DebateRoom.findById(roomId);
    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const group = await DebateGroup.findById(groupId).populate('commentIds');
    if (!group || group.debateRoomId.toString() !== roomId) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.commentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot regenerate content for empty group'
      });
    }

    // Generate new title and description
    const { generateGroupContent } = require('../services/generateGroupContent');
    const { title, description } = await generateGroupContent(group.commentIds);

    // Update the group
    const updatedGroup = await DebateGroup.findByIdAndUpdate(
      groupId,
      { title, description, updatedAt: new Date() },
      { new: true }
    ).populate('commentIds');

    res.json({
      success: true,
      message: 'Group content regenerated successfully',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error regenerating group content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate group content',
      error: error.message
    });
  }
};

// Relink all groups (re-evaluate counter-matching)
const relinkGroups = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const debateRoom = await DebateRoom.findById(roomId);
    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const forGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'for' });
    const againstGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'against' });
    
    const { findCounterGroup } = require('../services/findCounterGroup');
    let updated = 0;

    // Re-evaluate FOR groups against AGAINST groups
    for (const forGroup of forGroups) {
      if (againstGroups.length > 0) {
        const { counterGroupId } = await findCounterGroup(forGroup, againstGroups);
        if (counterGroupId !== forGroup.counterGroupId?.toString()) {
          await DebateGroup.findByIdAndUpdate(forGroup._id, { counterGroupId });
          
          // Update display order if new counter found
          if (counterGroupId) {
            const counterGroup = await DebateGroup.findById(counterGroupId);
            if (counterGroup) {
              await DebateGroup.findByIdAndUpdate(forGroup._id, { 
                displayOrder: counterGroup.displayOrder + 0.5 
              });
            }
          }
          updated++;
        }
      }
    }

    // Re-evaluate AGAINST groups against FOR groups
    for (const againstGroup of againstGroups) {
      if (forGroups.length > 0) {
        const { counterGroupId } = await findCounterGroup(againstGroup, forGroups);
        if (counterGroupId !== againstGroup.counterGroupId?.toString()) {
          await DebateGroup.findByIdAndUpdate(againstGroup._id, { counterGroupId });
          
          // Update display order if new counter found
          if (counterGroupId) {
            const counterGroup = await DebateGroup.findById(counterGroupId);
            if (counterGroup) {
              await DebateGroup.findByIdAndUpdate(againstGroup._id, { 
                displayOrder: counterGroup.displayOrder + 0.5 
              });
            }
          }
          updated++;
        }
      }
    }

    res.json({
      success: true,
      message: `Re-evaluated counter-group links. Updated ${updated} groups.`
    });
  } catch (error) {
    console.error('Error relinking groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to relink groups',
      error: error.message
    });
  }
};

// Get debug counter status
const getDebugCounterStatus = async (req, res) => {
  try {
    const { roomId } = req.params;

    const debateRoom = await DebateRoom.findById(roomId);
    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const allGroups = await DebateGroup.find({ debateRoomId: roomId })
      .populate('commentIds')
      .populate('counterGroupId')
      .sort({ stance: 1, displayOrder: 1 });
    
    const status = allGroups.map(group => ({
      id: group._id,
      title: group.title,
      stance: group.stance,
      commentCount: group.commentIds.length,
      counterGroupId: group.counterGroupId?._id || null,
      counterGroupTitle: group.counterGroupId?.title || null,
      displayOrder: group.displayOrder
    }));
    
    res.json({
      success: true,
      data: {
        totalGroups: allGroups.length,
        groupsWithCounters: allGroups.filter(g => g.counterGroupId).length,
        groups: status
      }
    });
  } catch (error) {
    console.error('Error fetching counter status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch counter status',
      error: error.message
    });
  }
};

module.exports = {
  createDebateRoom,
  getAllDebateRooms,
  getDebateRoom,
  joinDebateRoom,
  leaveDebateRoom,
  updateDebateRoom,
  deleteDebateRoom,
  regenerateGroupContent,
  relinkGroups,
  getDebugCounterStatus
};
