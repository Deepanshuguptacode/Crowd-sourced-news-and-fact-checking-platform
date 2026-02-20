const DebateGroup = require('../models/DebateGroup');
const DebateComment = require('../models/DebateComment');
const DebateRoom = require('../models/DebateRoom');
const { generateGroupContent } = require('../services/generateGroupContent');
const { findCounterGroup } = require('../services/findCounterGroup');

// Get all groups by stance or both stances for a debate room
const getDebateGroups = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { stance } = req.query;

    // Verify debate room exists
    const debateRoom = await DebateRoom.findById(roomId);
    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    if (stance) {
      // Return groups for specific stance
      const groups = await DebateGroup.find({ debateRoomId: roomId, stance })
        .populate('commentIds')
        .populate('counterGroupId')
        .sort({ displayOrder: 1 });
        
      console.log(`Found ${groups.length} groups for stance '${stance}'`);
      groups.forEach(group => {
        console.log(`Group: ${group.title}, counterGroupId: ${group.counterGroupId}`);
      });
        
      res.json({
        success: true,
        data: groups
      });
    } else {
      // Return both stances organized for display
      const forGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'for' })
        .populate('commentIds')
        .populate('counterGroupId')
        .sort({ displayOrder: 1 });
      
      const againstGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'against' })
        .populate('commentIds')
        .populate('counterGroupId')
        .sort({ displayOrder: 1 });

      console.log(`Found ${forGroups.length} FOR groups and ${againstGroups.length} AGAINST groups`);
      forGroups.forEach(group => {
        console.log(`FOR Group: ${group.title}, counterGroupId: ${group.counterGroupId}`);
      });
      againstGroups.forEach(group => {
        console.log(`AGAINST Group: ${group.title}, counterGroupId: ${group.counterGroupId}`);
      });

      res.json({
        success: true,
        data: { 
          for: forGroups, 
          against: againstGroups 
        }
      });
    }
  } catch (error) {
    console.error('Error fetching debate groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch debate groups',
      error: error.message
    });
  }
};

// Create a new debate group
const createDebateGroup = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { label, title, description, stance } = req.body;

    // Verify debate room exists
    const debateRoom = await DebateRoom.findById(roomId);
    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const group = new DebateGroup({ 
      debateRoomId: roomId,
      label, 
      title: title || label, 
      description: description || 'A new discussion group.',
      stance, 
      commentIds: [] 
    });

    await group.save();
    
    res.status(201).json({
      success: true,
      message: 'Debate group created successfully',
      data: group
    });
  } catch (error) {
    console.error('Error creating debate group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create debate group',
      error: error.message
    });
  }
};

// Get a specific debate group by ID
const getDebateGroup = async (req, res) => {
  try {
    const { roomId, groupId } = req.params;
    
    const group = await DebateGroup.findOne({ 
      _id: groupId, 
      debateRoomId: roomId 
    }).populate('commentIds');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Debate group not found'
      });
    }
    
    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error fetching debate group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch debate group',
      error: error.message
    });
  }
};

// Regenerate title and description for a specific group
const regenerateDebateGroup = async (req, res) => {
  try {
    const { roomId, groupId } = req.params;
    
    // Find the group and populate comments
    const group = await DebateGroup.findOne({ 
      _id: groupId, 
      debateRoomId: roomId 
    }).populate('commentIds');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Debate group not found'
      });
    }

    if (group.commentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot regenerate content for empty group'
      });
    }

    // Generate new title and description based on all comments
    const { title, description } = await generateGroupContent(group.commentIds);
    
    // Update the group
    const updatedGroup = await DebateGroup.findByIdAndUpdate(
      groupId,
      { title, description, updatedAt: new Date() },
      { new: true }
    ).populate('commentIds');

    res.json({
      success: true,
      message: 'Debate group regenerated successfully',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error regenerating debate group content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate debate group content',
      error: error.message
    });
  }
};

// Re-evaluate all counter-group matchings for a debate room
const relinkDebateGroups = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Verify debate room exists
    const debateRoom = await DebateRoom.findById(roomId);
    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    const forGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'for' });
    const againstGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'against' });
    
    let updated = 0;

    // Re-evaluate FOR groups against AGAINST groups
    for (const forGroup of forGroups) {
      if (againstGroups.length > 0) {
        const { counterGroupId } = await findCounterGroup(forGroup, againstGroups);
        if (counterGroupId && counterGroupId !== forGroup.counterGroupId?.toString()) {
          await DebateGroup.findByIdAndUpdate(forGroup._id, { counterGroupId });
          
          // Update display order if new counter found
          const counterGroup = await DebateGroup.findById(counterGroupId);
          if (counterGroup) {
            await DebateGroup.findByIdAndUpdate(forGroup._id, { 
              displayOrder: counterGroup.displayOrder + 0.5 
            });
          }
          updated++;
        }
      }
    }

    // Re-evaluate AGAINST groups against FOR groups
    for (const againstGroup of againstGroups) {
      if (forGroups.length > 0) {
        const { counterGroupId } = await findCounterGroup(againstGroup, forGroups);
        if (counterGroupId && counterGroupId !== againstGroup.counterGroupId?.toString()) {
          await DebateGroup.findByIdAndUpdate(againstGroup._id, { counterGroupId });
          
          // Update display order if new counter found
          const counterGroup = await DebateGroup.findById(counterGroupId);
          if (counterGroup) {
            await DebateGroup.findByIdAndUpdate(againstGroup._id, { 
              displayOrder: counterGroup.displayOrder + 0.5 
            });
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
    console.error('Error relinking debate groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to relink debate groups',
      error: error.message
    });
  }
};

// Get counter-group analysis for a specific group
const getCounterAnalysis = async (req, res) => {
  try {
    const { roomId, groupId } = req.params;
    
    const group = await DebateGroup.findOne({ 
      _id: groupId, 
      debateRoomId: roomId 
    }).populate('commentIds');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Debate group not found'
      });
    }

    let counterAnalysis = null;
    
    if (group.counterGroupId) {
      const counterGroup = await DebateGroup.findById(group.counterGroupId).populate('commentIds');
      
      if (counterGroup) {
        // Re-analyze the counter match to get confidence score
        const opposingStance = group.stance === 'for' ? 'against' : 'for';
        const opposingGroups = await DebateGroup.find({ 
          debateRoomId: roomId, 
          stance: opposingStance 
        });
        
        const { counterGroupId, confidence, reasoning } = await findCounterGroup(group, opposingGroups);
        
        counterAnalysis = {
          counterGroup,
          confidence,
          reasoning,
          isStillValid: counterGroupId === group.counterGroupId.toString()
        };
      }
    }

    res.json({
      success: true,
      data: {
        group,
        counterAnalysis
      }
    });
  } catch (error) {
    console.error('Error getting counter analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get counter analysis',
      error: error.message
    });
  }
};

module.exports = {
  getDebateGroups,
  createDebateGroup,
  getDebateGroup,
  regenerateDebateGroup,
  relinkDebateGroups,
  getCounterAnalysis
};
