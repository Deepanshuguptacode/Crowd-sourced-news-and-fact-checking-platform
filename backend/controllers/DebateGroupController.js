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
        .populate('counterGroups.groupId') // Populate the new counterGroups array
        .sort({ displayOrder: 1 })
        .lean();

      return res.json({ success: true, data: groups });
    }

    // Return both stances
    const [forGroups, againstGroups] = await Promise.all([
      DebateGroup.find({ debateRoomId: roomId, stance: 'for' })
        .populate('commentIds')
        .populate('counterGroupId')
        .populate('counterGroups.groupId')
        .sort({ displayOrder: 1 })
        .lean(),
      DebateGroup.find({ debateRoomId: roomId, stance: 'against' })
        .populate('commentIds')
        .populate('counterGroupId')
        .populate('counterGroups.groupId')
        .sort({ displayOrder: 1 })
        .lean(),
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
// Uses a global optimal matching strategy to ensure bidirectional consistency:
//   1. Clear ALL existing links
//   2. Let each FOR group find its best AGAINST match
//   3. Resolve conflicts (two FOR groups wanting the same AGAINST group)
//   4. Write clean bidirectional links
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

    // Step 1: Clear ALL existing counter-group links in this room
    const allGroupIds = [...forGroups, ...againstGroups].map(g => g._id);
    await DebateGroup.updateMany(
      { _id: { $in: allGroupIds } },
      { $set: { counterGroupId: null } }
    );

    // Step 2: For each FOR group, find best AGAINST match with score
    // candidateLinks = [{ forId, againstId, score }]
    const candidateLinks = [];

    for (const g of forGroups) {
      // Generate group embedding from title+desc as fallback (no specific comment)
      const groupContent = `${g.title}. ${g.description}`;
      const groupEmbedding = await vectorService.generateEmbedding(groupContent);
      
      const match = await vectorService.findCounterByIdealMatch(
        g._id.toString(), groupEmbedding, roomId, 'against'
      );
      if (match && match.passesThreshold) {
        candidateLinks.push({
          forId: g._id.toString(),
          againstId: match.counterGroupId,
          score: match.score,
          bestScore: match.bestScore,
        });
      }
    }

    // Also check AGAINST→FOR to find links that FOR→AGAINST might miss
    for (const g of againstGroups) {
      const groupContent = `${g.title}. ${g.description}`;
      const groupEmbedding = await vectorService.generateEmbedding(groupContent);
      
      const match = await vectorService.findCounterByIdealMatch(
        g._id.toString(), groupEmbedding, roomId, 'for'
      );
      if (match && match.passesThreshold) {
        candidateLinks.push({
          forId: match.counterGroupId,
          againstId: g._id.toString(),
          score: match.score,
          bestScore: match.bestScore,
        });
      }
    }

    // Step 3: Greedy optimal matching — sort by score descending,
    // then assign each pair only if neither side is already taken
    candidateLinks.sort((a, b) => b.score - a.score);

    const usedFor = new Set();
    const usedAgainst = new Set();
    const finalPairs = [];

    for (const link of candidateLinks) {
      if (!usedFor.has(link.forId) && !usedAgainst.has(link.againstId)) {
        finalPairs.push(link);
        usedFor.add(link.forId);
        usedAgainst.add(link.againstId);
      }
    }

    // Step 4: Write bidirectional links
    let updated = 0;
    for (const pair of finalPairs) {
      // Use bestScore if available from the new matching system
      const scoreToSave = pair.bestScore || pair.score;
      await DebateGroup.findByIdAndUpdate(pair.forId, { counterGroupId: pair.againstId, counterMatchScore: scoreToSave });
      await DebateGroup.findByIdAndUpdate(pair.againstId, { counterGroupId: pair.forId, counterMatchScore: scoreToSave });

      // Sync display order
      const againstGroup = await DebateGroup.findById(pair.againstId);
      if (againstGroup) {
        await DebateGroup.findByIdAndUpdate(pair.forId, { displayOrder: againstGroup.displayOrder + 0.5 });
      }
      updated++;
    }

    console.log(`🔗 relinkDebateGroups: ${finalPairs.length} pairs linked out of ${forGroups.length} for / ${againstGroups.length} against groups`);

    res.json({
      success: true,
      message: `Re-evaluated counter-group links. Created ${updated} bidirectional pairs.`,
      data: {
        forGroups: forGroups.length,
        againstGroups: againstGroups.length,
        pairedGroups: updated,
        pairs: finalPairs.map(p => ({ for: p.forId, against: p.againstId, score: p.score.toFixed(3) })),
      },
    });
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
        const groupContent = `${group.title}. ${group.description}`;
        const groupEmbedding = await vectorService.generateEmbedding(groupContent);
        
        const match = await vectorService.findCounterByIdealMatch(
          groupId, groupEmbedding, roomId, opposingStance
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
