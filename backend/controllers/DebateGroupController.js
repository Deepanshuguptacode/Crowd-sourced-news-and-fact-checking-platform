const DebateGroup = require('../models/DebateGroup');
const DebateComment = require('../models/DebateComment');
const DebateRoom = require('../models/DebateRoom');
const vectorService = require('../services/vectorService');
const llmService = require('../services/llmService');

// Get all groups by stance or both stances for a debate room
const getDebateGroups = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { stance } = req.query;

    const roomExists = await DebateRoom.exists({ _id: roomId });
    if (!roomExists) {
      return res.status(404).json({ success: false, message: 'Debate room not found' });
    }

    if (stance) {
      const groups = await DebateGroup.find({ debateRoomId: roomId, stance })
        .populate('commentIds')
        .populate('counterGroupId')
        .sort({ displayOrder: 1 })
        .lean();

      return res.json({ success: true, data: groups });
    }

    // Return both stances
    const [forGroups, againstGroups] = await Promise.all([
      DebateGroup.find({ debateRoomId: roomId, stance: 'for' })
        .populate('commentIds').populate('counterGroupId').sort({ displayOrder: 1 }).lean(),
      DebateGroup.find({ debateRoomId: roomId, stance: 'against' })
        .populate('commentIds').populate('counterGroupId').sort({ displayOrder: 1 }).lean(),
    ]);

    res.json({ success: true, data: { for: forGroups, against: againstGroups } });
  } catch (error) {
    console.error('Error fetching debate groups:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch debate groups', error: error.message });
  }
};

// Create a new debate group
const createDebateGroup = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { label, title, description, stance } = req.body;

    const roomExists = await DebateRoom.exists({ _id: roomId });
    if (!roomExists) {
      return res.status(404).json({ success: false, message: 'Debate room not found' });
    }

    const group = new DebateGroup({
      debateRoomId: roomId,
      label,
      title: title || label,
      description: description || 'A new discussion group.',
      stance,
      commentIds: [],
    });
    await group.save();

    // Store embedding in Pinecone (fire-and-forget)
    vectorService.storeDebateGroup(
      group._id.toString(), group.title, group.description, roomId, stance
    ).catch(err => console.error('Pinecone store error:', err.message));

    res.status(201).json({ success: true, message: 'Debate group created successfully', data: group });
  } catch (error) {
    console.error('Error creating debate group:', error);
    res.status(500).json({ success: false, message: 'Failed to create debate group', error: error.message });
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

    const group = await DebateGroup.findOne({ _id: groupId, debateRoomId: roomId })
      .populate('commentIds');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Debate group not found' });
    }
    if (group.commentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot regenerate content for empty group' });
    }

    // Generate new title + description via LLM
    const { title, description } = await llmService.generateGroupContent(group.commentIds);

    const updatedGroup = await DebateGroup.findByIdAndUpdate(
      groupId,
      { title, description, updatedAt: new Date() },
      { new: true }
    ).populate('commentIds');

    // Update Pinecone embedding in background
    vectorService.storeDebateGroup(
      groupId, title, description, roomId, group.stance
    ).catch(err => console.error('Pinecone update error:', err.message));

    res.json({ success: true, message: 'Debate group regenerated successfully', data: updatedGroup });
  } catch (error) {
    console.error('Error regenerating debate group content:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate debate group content', error: error.message });
  }
};

// Re-evaluate all counter-group matchings for a debate room (vector-powered)
const relinkDebateGroups = async (req, res) => {
  try {
    const { roomId } = req.params;

    const roomExists = await DebateRoom.exists({ _id: roomId });
    if (!roomExists) {
      return res.status(404).json({ success: false, message: 'Debate room not found' });
    }

    const [forGroups, againstGroups] = await Promise.all([
      DebateGroup.find({ debateRoomId: roomId, stance: 'for' }).lean(),
      DebateGroup.find({ debateRoomId: roomId, stance: 'against' }).lean(),
    ]);

    let updated = 0;

    // Match FOR → AGAINST
    for (const g of forGroups) {
      const match = await vectorService.findCounterGroup(
        g._id.toString(), g.title, g.description, roomId, 'against'
      );
      if (match && match.counterGroupId !== g.counterGroupId?.toString()) {
        await DebateGroup.findByIdAndUpdate(g._id, { counterGroupId: match.counterGroupId });
        updated++;
      }
    }

    // Match AGAINST → FOR
    for (const g of againstGroups) {
      const match = await vectorService.findCounterGroup(
        g._id.toString(), g.title, g.description, roomId, 'for'
      );
      if (match && match.counterGroupId !== g.counterGroupId?.toString()) {
        await DebateGroup.findByIdAndUpdate(g._id, { counterGroupId: match.counterGroupId });
        updated++;
      }
    }

    res.json({ success: true, message: `Re-evaluated counter-group links. Updated ${updated} groups.` });
  } catch (error) {
    console.error('Error relinking debate groups:', error);
    res.status(500).json({ success: false, message: 'Failed to relink debate groups', error: error.message });
  }
};

// Get counter-group analysis for a specific group (vector-powered)
const getCounterAnalysis = async (req, res) => {
  try {
    const { roomId, groupId } = req.params;

    const group = await DebateGroup.findOne({ _id: groupId, debateRoomId: roomId })
      .populate('commentIds')
      .lean();

    if (!group) {
      return res.status(404).json({ success: false, message: 'Debate group not found' });
    }

    let counterAnalysis = null;

    if (group.counterGroupId) {
      const counterGroup = await DebateGroup.findById(group.counterGroupId)
        .populate('commentIds')
        .lean();

      if (counterGroup) {
        const opposingStance = group.stance === 'for' ? 'against' : 'for';
        const match = await vectorService.findCounterGroup(
          groupId, group.title, group.description, roomId, opposingStance
        );

        counterAnalysis = {
          counterGroup,
          confidence: match?.score ?? 0,
          isStillValid: match?.counterGroupId === group.counterGroupId.toString(),
        };
      }
    }

    res.json({ success: true, data: { group, counterAnalysis } });
  } catch (error) {
    console.error('Error getting counter analysis:', error);
    res.status(500).json({ success: false, message: 'Failed to get counter analysis', error: error.message });
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
