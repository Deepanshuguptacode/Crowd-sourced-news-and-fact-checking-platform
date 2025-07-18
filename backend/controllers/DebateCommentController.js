const DebateComment = require('../models/DebateComment');
const DebateGroup = require('../models/DebateGroup');
const DebateRoom = require('../models/DebateRoom');
const llmService = require('../services/llmService');
const { generateGroupContent } = require('../services/generateGroupContent');
const { findCounterGroup } = require('../services/findCounterGroup');

// Create a new debate comment
const createDebateComment = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, stance } = req.body;
    const author = req.user._id;
    const authorModel = req.userType === 'normal' ? 'NormalUser' : 
                       req.userType === 'community' ? 'CommunityUser' : 'ExpertUser';
    const authorName = req.user.name;

    // Verify debate room exists and user is a participant
    const debateRoom = await DebateRoom.findById(roomId);
    if (!debateRoom) {
      return res.status(404).json({
        success: false,
        message: 'Debate room not found'
      });
    }

    // Check if user is a participant
    const isParticipant = debateRoom.participants.some(p => p.userId.toString() === author.toString());
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You must join the debate room to post comments'
      });
    }

    // Create the comment
    const comment = new DebateComment({ 
      debateRoomId: roomId,
      text, 
      stance, 
      author,
      authorModel,
      authorName
    });
    await comment.save();

    // Fetch groups with same stance in this debate room
    const groups = await DebateGroup.find({ debateRoomId: roomId, stance });
    const labels = groups.map(g => g.label);

    const { matchedGroup, shouldCreateNew, newLabel } = await llmService.classifyComment(text, labels);

    let group;
    let isNewGroup = false;

    if (!shouldCreateNew) {
      // Update existing group
      group = await DebateGroup.findOne({ label: matchedGroup, debateRoomId: roomId, stance });
      if (group) {
        group.commentIds.push(comment._id);
        group.label = newLabel;
        group.updatedAt = new Date();
        await group.save();

        // Get all comments in the group (including the new one)
        const allComments = await DebateComment.find({ _id: { $in: group.commentIds } });
        
        // Generate updated title and description
        const { title, description } = await generateGroupContent(allComments);
        
        // Update the group with new title and description
        group.title = title;
        group.description = description;
        await group.save();

        // Re-evaluate counter-matching since group content changed
        const opposingStance = stance === 'for' ? 'against' : 'for';
        const opposingGroups = await DebateGroup.find({ debateRoomId: roomId, stance: opposingStance });
        
        console.log(`Re-evaluating counter-matching for group ${group._id} (${stance}). Found ${opposingGroups.length} opposing groups.`);
        
        if (opposingGroups.length > 0) {
          const { counterGroupId, confidence, reasoning } = await findCounterGroup(group, opposingGroups);
          
          console.log(`Counter-matching result: counterGroupId=${counterGroupId}, confidence=${confidence}, reasoning="${reasoning}"`);
          
          if (counterGroupId && counterGroupId !== group.counterGroupId?.toString()) {
            // Remove old counter-linking if it exists
            if (group.counterGroupId) {
              await DebateGroup.findByIdAndUpdate(group.counterGroupId, { counterGroupId: null });
            }
            
            // Update counter-linking (bidirectional)
            await DebateGroup.findByIdAndUpdate(group._id, { counterGroupId });
            await DebateGroup.findByIdAndUpdate(counterGroupId, { counterGroupId: group._id });
            
            console.log(`Updated bidirectional counter-linking between ${group._id} and ${counterGroupId}`);
            
            // Update display order to place this group below its counter
            const counterGroup = await DebateGroup.findById(counterGroupId);
            if (counterGroup) {
              await DebateGroup.findByIdAndUpdate(group._id, { 
                displayOrder: counterGroup.displayOrder + 0.5 
              });
            }
          }
        }
      } else {
        // Group not found, create new one
        shouldCreateNew = true;
      }
    }

    if (shouldCreateNew) {
      // Create new group
      isNewGroup = true;
      const { title, description } = await generateGroupContent([comment]);
      
      // Find opposing groups to match against
      const opposingStance = stance === 'for' ? 'against' : 'for';
      const opposingGroups = await DebateGroup.find({ debateRoomId: roomId, stance: opposingStance });
      
      console.log(`Creating new group (${stance}). Found ${opposingGroups.length} opposing groups for counter-matching.`);
      
      let counterGroupId = null;
      let displayOrder = 0;
      
      if (opposingGroups.length > 0) {
        const newGroupData = { title, description, stance };
        const { counterGroupId: foundCounterId, confidence, reasoning } = await findCounterGroup(newGroupData, opposingGroups);
        
        console.log(`New group counter-matching result: counterGroupId=${foundCounterId}, confidence=${confidence}, reasoning="${reasoning}"`);
        
        if (foundCounterId) {
          counterGroupId = foundCounterId;
          // Set display order to appear below the counter group
          const counterGroup = await DebateGroup.findById(foundCounterId);
          displayOrder = counterGroup ? counterGroup.displayOrder + 0.5 : 0;
        } else {
          // No counter found, add to end
          const maxOrder = await DebateGroup.findOne({ debateRoomId: roomId, stance }).sort({ displayOrder: -1 });
          displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
        }
      }
      
      group = new DebateGroup({ 
        debateRoomId: roomId,
        label: newLabel, 
        title,
        description,
        stance, 
        commentIds: [comment._id],
        counterGroupId,
        displayOrder
      });
      await group.save();
      
      // If we found a counter group, update it to point back (bidirectional linking)
      if (counterGroupId) {
        await DebateGroup.findByIdAndUpdate(counterGroupId, { counterGroupId: group._id });
        console.log(`Created bidirectional counter-linking between new group ${group._id} and ${counterGroupId}`);
      }
    }

    // Update comment with group reference
    comment.groupId = group._id;
    await comment.save();

    // Populate the group with comments for response
    const populatedGroup = await DebateGroup.findById(group._id).populate('commentIds');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment,
        group: populatedGroup,
        isNewGroup
      }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

// Get all comments for a debate room (grouped format)
const getDebateComments = async (req, res) => {
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
      
      res.json({
        success: true,
        data: groups
      });
    } else {
      // Chat view - return both stances organized for display
      const forGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'for' })
        .populate('commentIds')
        .populate('counterGroupId')
        .sort({ displayOrder: 1 });
      
      const againstGroups = await DebateGroup.find({ debateRoomId: roomId, stance: 'against' })
        .populate('commentIds')
        .populate('counterGroupId')
        .sort({ displayOrder: 1 });

      res.json({
        success: true,
        data: { for: forGroups, against: againstGroups }
      });
    }
  } catch (error) {
    console.error('Error fetching debate comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

// Get comments by group
const getCommentsByGroup = async (req, res) => {
  try {
    const { roomId, groupId } = req.params;

    const group = await DebateGroup.findOne({ 
      _id: groupId, 
      debateRoomId: roomId 
    }).populate('commentIds');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error fetching comments by group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

// Update a comment (only by author)
const updateDebateComment = async (req, res) => {
  try {
    const { roomId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const comment = await DebateComment.findOne({ 
      _id: commentId, 
      debateRoomId: roomId 
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own comments'
      });
    }

    comment.text = text;
    comment.updatedAt = new Date();
    await comment.save();

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

// Delete a comment (only by author)
const deleteDebateComment = async (req, res) => {
  try {
    const { roomId, commentId } = req.params;
    const userId = req.user._id;

    const comment = await DebateComment.findOne({ 
      _id: commentId, 
      debateRoomId: roomId 
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Remove comment from its group
    if (comment.groupId) {
      await DebateGroup.findByIdAndUpdate(
        comment.groupId,
        { $pull: { commentIds: commentId } }
      );
    }

    await DebateComment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// Like a comment
const likeComment = async (req, res) => {
  try {
    const { roomId, commentId } = req.params;
    const userId = req.user._id;

    const comment = await DebateComment.findOne({ 
      _id: commentId, 
      debateRoomId: roomId 
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already liked this comment
    const hasLiked = comment.likes && comment.likes.includes(userId);
    if (hasLiked) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this comment'
      });
    }

    // Remove from dislikes if present and add to likes
    const updatedComment = await DebateComment.findByIdAndUpdate(
      commentId,
      { 
        $addToSet: { likes: userId },
        $pull: { dislikes: userId }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Comment liked successfully',
      data: updatedComment
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like comment',
      error: error.message
    });
  }
};

// Dislike a comment
const dislikeComment = async (req, res) => {
  try {
    const { roomId, commentId } = req.params;
    const userId = req.user._id;

    const comment = await DebateComment.findOne({ 
      _id: commentId, 
      debateRoomId: roomId 
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already disliked this comment
    const hasDisliked = comment.dislikes && comment.dislikes.includes(userId);
    if (hasDisliked) {
      return res.status(400).json({
        success: false,
        message: 'You have already disliked this comment'
      });
    }

    // Remove from likes if present and add to dislikes
    const updatedComment = await DebateComment.findByIdAndUpdate(
      commentId,
      { 
        $addToSet: { dislikes: userId },
        $pull: { likes: userId }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Comment disliked successfully',
      data: updatedComment
    });
  } catch (error) {
    console.error('Error disliking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dislike comment',
      error: error.message
    });
  }
};

// Get debug counter status for comments
const getDebugCounterStatus = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Get all groups for this debate room
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
    console.error('Error fetching comment debug counter status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch counter status',
      error: error.message
    });
  }
};

module.exports = {
  createDebateComment,
  getDebateComments,
  getCommentsByGroup,
  updateDebateComment,
  deleteDebateComment,
  likeComment,
  dislikeComment,
  getDebugCounterStatus
};
