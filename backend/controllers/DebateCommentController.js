/**
 * DebateCommentController  (vector-optimised, LLM-reduced)
 *
 * Optimisations:
 *   • Single embedding generated once, reused for topic check + group match
 *   • Combined LLM call (classify + generate) saves 1 call in miss case
 *   • API key rotation between embedding and LLM calls
 *
 * Flow per comment (blocking path):
 *   1. generateEmbedding(text)               → 1 embedding call (~200 ms)
 *   2. checkTopicRelevance (reuses embedding) → 0 extra calls   (~50 ms)
 *   3. matchDebateComment  (reuses embedding) → 0 extra calls   (~50 ms)
 *      • Hit  → add comment to group          → 0 LLM calls
 *      • Miss → classifyAndGenerateContent    → 1 LLM call      (~1 s)
 *   4. Background (non-blocking):
 *      • generateGroupContent + storeDebateGroup + findCounterGroup
 *
 *   Best case: 1 embedding, 0 LLM  (~300 ms)
 *   Worst case: 1 embedding, 1 LLM (~1.3 s)
 */

const DebateComment = require('../models/DebateComment');
const DebateGroup   = require('../models/DebateGroup');
const DebateRoom    = require('../models/DebateRoom');
const vectorService = require('../services/vectorService');
const llmService    = require('../services/llmService');
const geminiKeyRotation = require('../services/geminiKeyRotation');

// ── helper: fire-and-forget background work ──────────────────────────────
function background(fn) {
  fn().catch(err => console.error('[bg]', err.message));
}

// =========================================================================
//  CREATE COMMENT
// =========================================================================
const createDebateComment = async (req, res) => {
  const startTime = Date.now();
  try {
    const { roomId } = req.params;
    const { text, stance } = req.body;
    const author      = req.user._id;
    const authorModel = req.userType === 'normal' ? 'NormalUser'
                      : req.userType === 'community' ? 'CommunityUser' : 'ExpertUser';
    const authorName  = req.user.name;

    console.log(`🗣️ Creating debate comment:`);
    console.log(`   Room ID: ${roomId}`);
    console.log(`   Author: ${authorName} (${authorModel})`);
    console.log(`   Stance: ${stance}`);
    console.log(`   Text: "${text.substring(0, 80)}..."`);
    console.log(`   Text length: ${text.length} chars`);

    // ── verify room & participation ─────────────────────────────────────
    const debateRoom = await DebateRoom.findById(roomId);
    if (!debateRoom) return res.status(404).json({ success: false, message: 'Debate room not found' });

    const isParticipant = debateRoom.participants.some(p => p.userId.toString() === author.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'You must join the debate room to post comments' });

    console.log(`✅ Room verification passed for "${debateRoom.title}"`);

    // ── Generate embedding ONCE — reused for topic check + group match ──
    console.log(`🧠 Starting vector processing...`);
    const embeddingStartTime = Date.now();
    const commentEmbedding = await vectorService.generateEmbedding(text);
    const embeddingDuration = Date.now() - embeddingStartTime;
    
    if (commentEmbedding) {
      console.log(`✅ Embedding generated (${embeddingDuration}ms, dim: ${commentEmbedding.length})`);
    } else {
      console.log(`❌ Embedding generation failed (${embeddingDuration}ms)`);
    }

    // Use different API key for next call type
    geminiKeyRotation.advanceKey();

    // ── 1. off-topic check (reuses pre-computed embedding) ─────────────
    let offTopic = { isOffTopic: false, label: 'Relevant', reason: '' };
    try {
      const result = await vectorService.checkTopicRelevance(text, roomId, commentEmbedding);
      if (result) offTopic = result;
      // Ensure topic is stored for future checks (fire-and-forget)
      background(async () => vectorService.storeDebateTopic(roomId, debateRoom.title, debateRoom.description));
    } catch (_) { /* default to relevant */ }

    // ── 2. save comment ─────────────────────────────────────────────────
    const comment = new DebateComment({
      debateRoomId: roomId,
      text,
      stance,
      author,
      authorModel,
      authorName,
      isOffTopic:          offTopic.isOffTopic,
      offTopicReason:      offTopic.reason || '',
      topicRelevanceLabel: offTopic.label  || 'Relevant',
    });
    await comment.save();

    // ── 3. group matching (reuses SAME pre-computed embedding) ──────────
    let group;
    let isNewGroup = false;

    const vectorMatch = await vectorService.matchDebateComment(text, roomId, stance, commentEmbedding);

    if (vectorMatch) {
      // ─ matched existing group ─────────────────────────────────────────
      group = await DebateGroup.findById(vectorMatch.groupId);
      if (group) {
        group.commentIds.push(comment._id);
        group.updatedAt = new Date();
        await group.save();

        // Background: regenerate title/description + update vector + counter-match
        background(async () => {
          geminiKeyRotation.advanceKey();
          const allComments = await DebateComment.find({ _id: { $in: group.commentIds } });
          const { title, description } = await llmService.generateGroupContent(allComments);
          group.title = title;
          group.description = description;
          await group.save();

          // Update Pinecone
          const stored = await vectorService.storeDebateGroup(group._id, title, description, roomId, stance);
          if (!stored) console.log(`Vector store failed for group ${group._id}, will retry later`);

          // Re-evaluate counter-matching (always check for better matches)
          console.log(`🔗 Background: Re-evaluating counter-group matching`);
          geminiKeyRotation.advanceKey();
          const opposingStance = stance === 'for' ? 'against' : 'for';
          const counter = await vectorService.findCounterGroup(group._id, title, description, roomId, opposingStance);
          
          if (counter) {
            const currentCounterId = group.counterGroupId?.toString();
            const newCounterId = counter.counterGroupId;
            const shouldUpdate = !currentCounterId || newCounterId !== currentCounterId;
            
            console.log(`🔍 Counter-match evaluation:`);
            console.log(`   Current counter: ${currentCounterId || 'NONE'}`);
            console.log(`   New best match: ${newCounterId} (score: ${counter.score})`);
            console.log(`   Should update: ${shouldUpdate}`);
            
            if (shouldUpdate) {
              console.log(`🔗 Background: Updating counter-group links`);
              
              // Clear old counter-group link if it exists
              if (currentCounterId && currentCounterId !== newCounterId) {
                console.log(`🔗 Clearing old counter-link: ${currentCounterId}`);
                await DebateGroup.findByIdAndUpdate(currentCounterId, { counterGroupId: null });
              }
              
              // Clear any existing link the new counter-group might have
              const newCounterGroup = await DebateGroup.findById(newCounterId);
              if (newCounterGroup?.counterGroupId && newCounterGroup.counterGroupId.toString() !== group._id.toString()) {
                console.log(`🔗 Clearing existing link from new counter-group`);
                await DebateGroup.findByIdAndUpdate(newCounterGroup.counterGroupId, { counterGroupId: null });
              }
              
              // Create bidirectional links
              await DebateGroup.findByIdAndUpdate(group._id, { counterGroupId: newCounterId });
              await DebateGroup.findByIdAndUpdate(newCounterId, { counterGroupId: group._id });
              
              // Sync display order
              if (newCounterGroup) {
                await DebateGroup.findByIdAndUpdate(group._id, { displayOrder: newCounterGroup.displayOrder + 0.5 });
                console.log(`✅ Background: Counter-group linking complete with synchronized display order`);
              }
            } else {
              console.log(`ℹ️ Background: Counter-group link unchanged (already optimal)`);
            }
          } else {
            console.log(`ℹ️ Background: No suitable counter-group found`);
            
            // If we had a counter-group but no longer have a good match, consider clearing it
            if (group.counterGroupId) {
              console.log(`🔗 Background: Clearing poor-quality counter-group link`);
              await DebateGroup.findByIdAndUpdate(group.counterGroupId, { counterGroupId: null });
              await DebateGroup.findByIdAndUpdate(group._id, { counterGroupId: null });
            }
          }
        });
      } else {
        // group deleted between check and find — treat as miss
        isNewGroup = true;
      }
    }

    if (!vectorMatch || isNewGroup) {
      // ─ no vector match → single combined LLM call ─────────────────────
      console.log(`🆕 Creating new group - no vector match found`);
      isNewGroup = true;

      geminiKeyRotation.advanceKey();
      const groups = await DebateGroup.find({ debateRoomId: roomId, stance });
      const labels = groups.map(g => g.label);
      
      console.log(`🧠 Starting LLM classifyAndGenerate with ${groups.length} existing groups`);
      console.log(`📋 Existing labels: [${labels.slice(0, 3).join(', ')}${labels.length > 3 ? '...' : ''}]`);

      // Single LLM call: classify + generate title/description
      const llmStartTime = Date.now();
      const result = await llmService.classifyAndGenerateContent(text, labels);
      const llmDuration = Date.now() - llmStartTime;
      
      console.log(`✅ LLM classifyAndGenerate completed (${llmDuration}ms)`);
      console.log(`🎯 Result: ${result.shouldCreateNew ? 'NEW GROUP' : 'MATCHED EXISTING'}`);
      console.log(`📝 New Label: "${result.newLabel}"`);
      console.log(`🏷️ Title: "${result.title}"`);

      // Did LLM find an existing match?
      let existingGroup = null;
      if (!result.shouldCreateNew && result.matchedGroup) {
        existingGroup = await DebateGroup.findOne({ label: result.matchedGroup, debateRoomId: roomId, stance });
      }

      if (existingGroup) {
        group = existingGroup;
        group.commentIds.push(comment._id);
        group.label = result.newLabel;
        group.updatedAt = new Date();
        await group.save();
        isNewGroup = false;

        // Background: refresh title/desc with all comments
        background(async () => {
          geminiKeyRotation.advanceKey();
          const allComments = await DebateComment.find({ _id: { $in: group.commentIds } });
          const { title, description } = await llmService.generateGroupContent(allComments);
          group.title = title; group.description = description;
          await group.save();
          vectorService.storeDebateGroup(group._id, title, description, roomId, stance);
        });
      } else {
        // Create brand-new group (title+desc already from combined LLM call)
        const title = result.title;
        const description = result.description;

        // Counter-match via vector
        geminiKeyRotation.advanceKey();
        const opposingStance = stance === 'for' ? 'against' : 'for';
        let counterGroupId = null;
        let displayOrder = 0;

        const counter = await vectorService.findCounterGroup(null, title, description, roomId, opposingStance);
        if (counter) {
          counterGroupId = counter.counterGroupId;
          const cg = await DebateGroup.findById(counterGroupId);
          displayOrder = cg ? cg.displayOrder + 0.5 : 0;
        } else {
          const maxOrder = await DebateGroup.findOne({ debateRoomId: roomId, stance }).sort({ displayOrder: -1 });
          displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
        }

        group = new DebateGroup({
          debateRoomId: roomId,
          label: result.newLabel,
          title,
          description,
          stance,
          commentIds: [comment._id],
          counterGroupId,
          displayOrder,
        });
        await group.save();

        // Bidirectional counter-link
        if (counterGroupId) {
          await DebateGroup.findByIdAndUpdate(counterGroupId, { counterGroupId: group._id });
        }

        // Store in Pinecone (fire-and-forget)
        vectorService.storeDebateGroup(group._id, title, description, roomId, stance)
          .catch(err => console.error('Vector store error:', err.message));
      }
    }

    // ── 4. link comment to group ────────────────────────────────────────
    comment.groupId = group._id;
    await comment.save();

    const populatedGroup = await DebateGroup.findById(group._id).populate('commentIds');

    const totalDuration = Date.now() - startTime;
    console.log(`✅ Debate comment creation completed (${totalDuration}ms):`);
    console.log(`   Comment ID: ${comment._id}`);
    console.log(`   Group: "${group.title}" (${isNewGroup ? 'NEW' : 'EXISTING'})`);
    console.log(`   Group ID: ${group._id}`);
    console.log(`   Total comments in group: ${populatedGroup.commentIds.length}`);
    console.log(`   Off-topic: ${comment.isOffTopic ? 'YES' : 'NO'}`);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment, group: populatedGroup, isNewGroup },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment', error: error.message });
  }
};

// =========================================================================
//  GET COMMENTS  (grouped)
// =========================================================================
const getDebateComments = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { stance } = req.query;

    const debateRoom = await DebateRoom.findById(roomId);
    if (!debateRoom) return res.status(404).json({ success: false, message: 'Debate room not found' });

    if (stance) {
      const groups = await DebateGroup.find({ debateRoomId: roomId, stance })
        .populate({
          path: 'commentIds',
          populate: {
            path: 'author',
            select: 'name username _id'
          }
        })
        .populate('counterGroupId')
        .sort({ displayOrder: 1 })
        .lean();
      return res.json({ success: true, data: groups });
    }

    const [forGroups, againstGroups] = await Promise.all([
      DebateGroup.find({ debateRoomId: roomId, stance: 'for' })
        .populate({
          path: 'commentIds',
          populate: {
            path: 'author',
            select: 'name username _id'
          }
        })
        .populate('counterGroupId')
        .sort({ displayOrder: 1 })
        .lean(),
      DebateGroup.find({ debateRoomId: roomId, stance: 'against' })
        .populate({
          path: 'commentIds',
          populate: {
            path: 'author',
            select: 'name username _id'
          }
        })
        .populate('counterGroupId')
        .sort({ displayOrder: 1 })
        .lean(),
    ]);

    res.json({ success: true, data: { for: forGroups, against: againstGroups } });
  } catch (error) {
    console.error('Error fetching debate comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments', error: error.message });
  }
};

// =========================================================================
//  GET COMMENTS BY GROUP
// =========================================================================
const getCommentsByGroup = async (req, res) => {
  try {
    const { roomId, groupId } = req.params;
    const group = await DebateGroup.findOne({ _id: groupId, debateRoomId: roomId })
      .populate({
        path: 'commentIds',
        populate: {
          path: 'author',
          select: 'name username _id'
        }
      })
      .lean();
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    res.json({ success: true, data: group });
  } catch (error) {
    console.error('Error fetching comments by group:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments', error: error.message });
  }
};

// =========================================================================
//  UPDATE COMMENT
// =========================================================================
const updateDebateComment = async (req, res) => {
  try {
    const { roomId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const comment = await DebateComment.findOne({ _id: commentId, debateRoomId: roomId });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== userId.toString()) return res.status(403).json({ success: false, message: 'You can only update your own comments' });

    comment.text = text;
    comment.updatedAt = new Date();
    await comment.save();

    res.json({ success: true, message: 'Comment updated successfully', data: comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment', error: error.message });
  }
};

// =========================================================================
//  DELETE COMMENT
// =========================================================================
const deleteDebateComment = async (req, res) => {
  try {
    const { roomId, commentId } = req.params;
    const userId = req.user._id;

    const comment = await DebateComment.findOne({ _id: commentId, debateRoomId: roomId });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Allow author or admin to delete
    const isAuthor = comment.author.toString() === userId.toString();
    const isAdmin = req.userType === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }

    // Remove from group
    if (comment.groupId) {
      await DebateGroup.findByIdAndUpdate(comment.groupId, { $pull: { commentIds: commentId } });

      // If group is now empty, delete it + its vector
      const group = await DebateGroup.findById(comment.groupId);
      if (group && group.commentIds.length === 0) {
        // Unlink counter group
        if (group.counterGroupId) {
          await DebateGroup.findByIdAndUpdate(group.counterGroupId, { counterGroupId: null });
        }
        await vectorService.deleteVector(group._id.toString(), vectorService.getNamespaces().DEBATE_GROUPS);
        await DebateGroup.findByIdAndDelete(comment.groupId);
      }
    }

    await DebateComment.findByIdAndDelete(commentId);
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment', error: error.message });
  }
};

// =========================================================================
//  UNDO COMMENT (delete within time limit)
// =========================================================================
const undoDebateComment = async (req, res) => {
  try {
    const { roomId, commentId } = req.params;
    const userId = req.user._id;

    const comment = await DebateComment.findOne({ _id: commentId, debateRoomId: roomId });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check ownership
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only undo your own comments' });
    }

    // Check if comment was posted within the last 30 seconds (undo window)
    const timeDifference = Date.now() - comment.createdAt.getTime();
    const undoWindow = 30 * 1000; // 30 seconds
    
    if (timeDifference > undoWindow) {
      return res.status(400).json({ 
        success: false, 
        message: 'Undo window expired. Comment can no longer be undone.' 
      });
    }

    console.log(`🔄 UNDO: User ${userId} undoing comment ${commentId} (${Math.round(timeDifference/1000)}s old)`);

    // Remove from group (same logic as delete)
    if (comment.groupId) {
      await DebateGroup.findByIdAndUpdate(comment.groupId, { $pull: { commentIds: commentId } });

      const group = await DebateGroup.findById(comment.groupId);
      if (group && group.commentIds.length === 0) {
        console.log(`🔄 Undoing comment - deleting empty group: ${group._id}`);
        
        if (group.counterGroupId) {
          await DebateGroup.findByIdAndUpdate(group.counterGroupId, { counterGroupId: null });
        }
        await vectorService.deleteVector(group._id.toString(), vectorService.getNamespaces().DEBATE_GROUPS);
        await DebateGroup.findByIdAndDelete(comment.groupId);
      }
    }

    await DebateComment.findByIdAndDelete(commentId);
    
    res.json({ 
      success: true, 
      message: 'Comment undone successfully',
      undoAction: true
    });
  } catch (error) {
    console.error('Undo comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to undo comment',
      error: error.message
    });
  }
};

// =========================================================================
//  LIKE / DISLIKE
// =========================================================================
const likeComment = async (req, res) => {
  try {
    const { roomId, commentId } = req.params;
    const userId    = req.user._id;
    const userModel = req.user.userType;

    const comment = await DebateComment.findOne({ _id: commentId, debateRoomId: roomId });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.likes?.some(l => l.userId.toString() === userId.toString()))
      return res.status(400).json({ success: false, message: 'You have already liked this comment' });

    const updated = await DebateComment.findByIdAndUpdate(commentId, {
      $addToSet: { likes: { userId, userModel } },
      $pull:     { dislikes: { userId } },
    }, { new: true });

    res.json({ success: true, message: 'Comment liked successfully', data: updated });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ success: false, message: 'Failed to like comment', error: error.message });
  }
};

const dislikeComment = async (req, res) => {
  try {
    const { roomId, commentId } = req.params;
    const userId    = req.user._id;
    const userModel = req.user.userType;

    const comment = await DebateComment.findOne({ _id: commentId, debateRoomId: roomId });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.dislikes?.some(d => d.userId.toString() === userId.toString()))
      return res.status(400).json({ success: false, message: 'You have already disliked this comment' });

    const updated = await DebateComment.findByIdAndUpdate(commentId, {
      $addToSet: { dislikes: { userId, userModel } },
      $pull:     { likes: { userId } },
    }, { new: true });

    res.json({ success: true, message: 'Comment disliked successfully', data: updated });
  } catch (error) {
    console.error('Error disliking comment:', error);
    res.status(500).json({ success: false, message: 'Failed to dislike comment', error: error.message });
  }
};

// =========================================================================
//  DEBUG
// =========================================================================
const getDebugCounterStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const allGroups = await DebateGroup.find({ debateRoomId: roomId })
      .populate('commentIds').populate('counterGroupId').sort({ stance: 1, displayOrder: 1 }).lean();

    const status = allGroups.map(g => ({
      id: g._id, title: g.title, stance: g.stance,
      commentCount: g.commentIds.length,
      counterGroupId: g.counterGroupId?._id || null,
      counterGroupTitle: g.counterGroupId?.title || null,
      displayOrder: g.displayOrder,
    }));

    res.json({
      success: true,
      data: {
        totalGroups: allGroups.length,
        groupsWithCounters: allGroups.filter(g => g.counterGroupId).length,
        groups: status,
      },
    });
  } catch (error) {
    console.error('Error fetching comment debug counter status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch counter status', error: error.message });
  }
};

module.exports = {
  createDebateComment,
  getDebateComments,
  getCommentsByGroup,
  updateDebateComment,
  deleteDebateComment,
  undoDebateComment,
  likeComment,
  dislikeComment,
  getDebugCounterStatus,
};
