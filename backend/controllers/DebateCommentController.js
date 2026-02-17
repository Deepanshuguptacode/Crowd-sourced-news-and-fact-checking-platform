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

// ── per-room lock to prevent concurrent counter-link races ───────────────
const _roomLocks = new Map();
async function withRoomLock(roomId, fn) {
  const key = String(roomId);
  while (_roomLocks.get(key)) {
    await _roomLocks.get(key);
  }
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  _roomLocks.set(key, promise);
  try {
    return await fn();
  } finally {
    _roomLocks.delete(key);
    resolve();
  }
}

/**
 * Safely update bidirectional counter-group links.
 * Ensures consistency: if A↔B, then both point at each other.
 * Cleans up any old links that would become orphaned.
 */
async function updateCounterLinks(group, newCounterId) {
  const groupId = group._id.toString();
  const currentCounterId = group.counterGroupId?.toString() || null;

  // Nothing to do
  if (currentCounterId === newCounterId) return false;

  console.log(`🔗 Updating counter-links: ${groupId} -> ${newCounterId || 'NONE'} (was: ${currentCounterId || 'NONE'})`);

  // 1. Clear OLD bidirectional link
  if (currentCounterId) {
    const oldCounter = await DebateGroup.findById(currentCounterId);
    // Only clear the old counter's link if it still points back at us
    if (oldCounter?.counterGroupId?.toString() === groupId) {
      await DebateGroup.findByIdAndUpdate(currentCounterId, { counterGroupId: null });
      console.log(`   Cleared old counter ${currentCounterId} → null`);
    }
  }

  if (!newCounterId) {
    // Just clearing, no new link
    await DebateGroup.findByIdAndUpdate(groupId, { counterGroupId: null });
    return true;
  }

  // 2. If the NEW counter-group is already linked to someone else, clear that
  const newCounter = await DebateGroup.findById(newCounterId);
  if (newCounter?.counterGroupId && newCounter.counterGroupId.toString() !== groupId) {
    const thirdPartyId = newCounter.counterGroupId.toString();
    const thirdParty = await DebateGroup.findById(thirdPartyId);
    if (thirdParty?.counterGroupId?.toString() === newCounterId) {
      await DebateGroup.findByIdAndUpdate(thirdPartyId, { counterGroupId: null });
      console.log(`   Cleared third-party ${thirdPartyId} → null`);
    }
  }

  // 3. Create new bidirectional link
  await DebateGroup.findByIdAndUpdate(groupId, { counterGroupId: newCounterId });
  await DebateGroup.findByIdAndUpdate(newCounterId, { counterGroupId: groupId });
  console.log(`   Linked: ${groupId} ↔ ${newCounterId}`);

  // 4. Sync display order
  if (newCounter) {
    await DebateGroup.findByIdAndUpdate(groupId, { displayOrder: newCounter.displayOrder + 0.5 });
  }
  return true;
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

        // Background: regenerate title/description + LLM counter-match + vector comparison
        background(async () => {
          geminiKeyRotation.advanceKey();
          const allComments = await DebateComment.find({ _id: { $in: group.commentIds } });
          const opposingStance = stance === 'for' ? 'against' : 'for';
          const opposingGroups = await DebateGroup.find({ debateRoomId: roomId, stance: opposingStance }).lean();

          // Enrich opposing groups with comment text previews for LLM
          for (const og of opposingGroups) {
            const ogComments = await DebateComment.find({ _id: { $in: og.commentIds } }).select('text').limit(3).lean();
            og.commentTexts = ogComments.map(c => c.text);
          }

          const debateContext = `${debateRoom.title}${debateRoom.description ? ' — ' + debateRoom.description : ''}`;

          // Single LLM call: regenerate title/description + find counter-group
          const llmResult = await llmService.generateGroupContentWithCounter(allComments, opposingGroups, debateContext);
          group.title = llmResult.title;
          group.description = llmResult.description;
          await group.save();

          // Update Pinecone — AWAIT so vector is indexed
          const stored = await vectorService.storeDebateGroup(group._id, llmResult.title, llmResult.description, roomId, stance);
          if (!stored) console.log(`Vector store failed for group ${group._id}, will retry later`);

          // Also run vector counter-match FOR COMPARISON ONLY
          geminiKeyRotation.advanceKey();
          const vectorCounter = await vectorService.findCounterGroup(group._id, llmResult.title, llmResult.description, roomId, opposingStance);

          console.log(`📊 Counter-match comparison:`);
          console.log(`   LLM  → ${llmResult.counterGroupTitle || 'NONE'} (ID: ${llmResult.counterGroupId || 'NONE'}, confidence: ${llmResult.confidence}%)`);
          console.log(`   LLM reason: ${llmResult.counterReason}`);
          console.log(`   Vector → ${vectorCounter?.counterGroupId || 'NONE'} (score: ${vectorCounter?.score?.toFixed(3) || 'N/A'})`);

          // Use LLM result as the ACTUAL link, but preserve existing links if new confidence is low
          await withRoomLock(roomId, async () => {
            const freshGroup = await DebateGroup.findById(group._id);
            if (!freshGroup) return;

            // Store comparison info
            freshGroup.counterMatchInfo = {
              method: 'llm',
              llmReason: llmResult.counterReason,
              llmCounterTitle: llmResult.counterGroupTitle || null,
              llmConfidence: llmResult.confidence || 0,
              vectorCounterGroupId: vectorCounter?.counterGroupId || null,
              vectorCounterTitle: vectorCounter?.title || null,
              vectorScore: vectorCounter?.score || null,
              updatedAt: new Date(),
            };
            await freshGroup.save();

            // STABILITY RULE: Only update counter-link if new match meets threshold
            const currentCounterId = freshGroup.counterGroupId?.toString();
            const newCounterId = llmResult.counterGroupId;
            const confidence = llmResult.confidence || 0;

            if (newCounterId && confidence >= 85) {
              // New high-confidence match
              if (currentCounterId !== newCounterId) {
                console.log(`🔄 Updating counter-link: ${currentCounterId || 'NONE'} → ${newCounterId} (confidence: ${confidence}%)`);
                await updateCounterLinks(freshGroup, newCounterId);
              } else {
                console.log(`✅ Counter-link unchanged (already linked to same group with ${confidence}% confidence)`);
              }
            } else if (!newCounterId && currentCounterId) {
              console.log(`⚠️ New LLM result suggests no counter (confidence: ${confidence}%), but existing link preserved for stability`);
              // Keep existing link - don't break it unless we have a better candidate
            } else {
              console.log(`ℹ️ No valid counter-match (confidence: ${confidence}% < 85%)`);
            }
          });
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

        // Background: refresh title/desc + LLM counter-match + vector comparison
        background(async () => {
          geminiKeyRotation.advanceKey();
          const allComments = await DebateComment.find({ _id: { $in: group.commentIds } });
          const opposingStance = stance === 'for' ? 'against' : 'for';
          const opposingGroups = await DebateGroup.find({ debateRoomId: roomId, stance: opposingStance }).lean();

          // Enrich opposing groups with comment text previews for LLM
          for (const og of opposingGroups) {
            const ogComments = await DebateComment.find({ _id: { $in: og.commentIds } }).select('text').limit(3).lean();
            og.commentTexts = ogComments.map(c => c.text);
          }

          const debateContext = `${debateRoom.title}${debateRoom.description ? ' — ' + debateRoom.description : ''}`;

          // Single LLM call: regenerate title/description + find counter-group
          const llmResult = await llmService.generateGroupContentWithCounter(allComments, opposingGroups, debateContext);
          group.title = llmResult.title; group.description = llmResult.description;
          await group.save();

          await vectorService.storeDebateGroup(group._id, llmResult.title, llmResult.description, roomId, stance);

          // Vector counter-match for comparison
          geminiKeyRotation.advanceKey();
          const vectorCounter = await vectorService.findCounterGroup(group._id, llmResult.title, llmResult.description, roomId, opposingStance);

          console.log(`📊 Counter-match comparison (LLM-matched path):`);
          console.log(`   LLM  → ${llmResult.counterGroupTitle || 'NONE'} (ID: ${llmResult.counterGroupId || 'NONE'}, confidence: ${llmResult.confidence}%)`);
          console.log(`   Vector → ${vectorCounter?.counterGroupId || 'NONE'} (score: ${vectorCounter?.score?.toFixed(3) || 'N/A'})`);

          await withRoomLock(roomId, async () => {
            const freshGroup = await DebateGroup.findById(group._id);
            if (!freshGroup) return;

            const vectorCounterGroup = vectorCounter ? await DebateGroup.findById(vectorCounter.counterGroupId) : null;
            freshGroup.counterMatchInfo = {
              method: 'llm',
              llmReason: llmResult.counterReason,
              llmCounterTitle: llmResult.counterGroupTitle || null,
              llmConfidence: llmResult.confidence || 0,
              vectorCounterGroupId: vectorCounter?.counterGroupId || null,
              vectorCounterTitle: vectorCounter?.title || vectorCounterGroup?.title || null,
              vectorScore: vectorCounter?.score || null,
              updatedAt: new Date(),
            };
            await freshGroup.save();

            // STABILITY RULE: Only update counter-link if new match meets threshold
            const currentCounterId = freshGroup.counterGroupId?.toString();
            const newCounterId = llmResult.counterGroupId;
            const confidence = llmResult.confidence || 0;

            if (newCounterId && confidence >= 85) {
              if (currentCounterId !== newCounterId) {
                console.log(`🔄 Updating counter-link: ${currentCounterId || 'NONE'} → ${newCounterId} (confidence: ${confidence}%)`);
                await updateCounterLinks(freshGroup, newCounterId);
              } else {
                console.log(`✅ Counter-link unchanged (already linked to same group with ${confidence}% confidence)`);
              }
            } else if (!newCounterId && currentCounterId) {
              console.log(`⚠️ New LLM result suggests no counter (confidence: ${confidence}%), but existing link preserved for stability`);
            } else {
              console.log(`ℹ️ No valid counter-match (confidence: ${confidence}% < 85%)`);
            }
          });
        });
      } else {
        // Create brand-new group (title+desc already from combined LLM call)
        const title = result.title;
        const description = result.description;

        // Determine display order for the new group
        const opposingStance = stance === 'for' ? 'against' : 'for';
        let displayOrder = 0;
        const maxOrder = await DebateGroup.findOne({ debateRoomId: roomId, stance }).sort({ displayOrder: -1 });
        displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

        // Create group first (so it has an _id)
        group = new DebateGroup({
          debateRoomId: roomId,
          label: result.newLabel,
          title,
          description,
          stance,
          commentIds: [comment._id],
          counterGroupId: null,
          displayOrder,
        });
        await group.save();

        // AWAIT Pinecone store so the group is visible to future queries
        await vectorService.storeDebateGroup(group._id, title, description, roomId, stance);

        // Counter-match via LLM + vector comparison
        background(async () => {
          await withRoomLock(roomId, async () => {
            geminiKeyRotation.advanceKey();
            const opposingGroups = await DebateGroup.find({ debateRoomId: roomId, stance: opposingStance }).lean();

            // Enrich opposing groups with comment text previews for LLM
            for (const og of opposingGroups) {
              const ogComments = await DebateComment.find({ _id: { $in: og.commentIds } }).select('text').limit(3).lean();
              og.commentTexts = ogComments.map(c => c.text);
            }

            const debateContext = `${debateRoom.title}${debateRoom.description ? ' — ' + debateRoom.description : ''}`;

            // LLM counter-match (uses group's own text)
            const llmResult = await llmService.generateGroupContentWithCounter(
              [{ text: text }], // Use the actual comment text, not just title+desc
              opposingGroups,
              debateContext
            );

            // Vector counter-match for comparison
            geminiKeyRotation.advanceKey();
            const vectorCounter = await vectorService.findCounterGroup(
              group._id.toString(), title, description, roomId, opposingStance
            );

            console.log(`📊 Counter-match comparison (new group):`);
            console.log(`   LLM  → ${llmResult.counterGroupTitle || 'NONE'} (ID: ${llmResult.counterGroupId || 'NONE'}, confidence: ${llmResult.confidence}%)`);
            console.log(`   LLM reason: ${llmResult.counterReason}`);
            console.log(`   Vector → ${vectorCounter?.counterGroupId || 'NONE'} (score: ${vectorCounter?.score?.toFixed(3) || 'N/A'})`);

            // Store comparison info
            const freshGroup = await DebateGroup.findById(group._id);
            if (!freshGroup) return;

            freshGroup.counterMatchInfo = {
              method: 'llm',
              llmReason: llmResult.counterReason,
              llmCounterTitle: llmResult.counterGroupTitle || null,
              llmConfidence: llmResult.confidence || 0,
              vectorCounterGroupId: vectorCounter?.counterGroupId || null,
              vectorCounterTitle: vectorCounter?.title || null,
              vectorScore: vectorCounter?.score || null,
              updatedAt: new Date(),
            };
            await freshGroup.save();

            // Use LLM result for actual linking (only if confidence >= 85%)
            const confidence = llmResult.confidence || 0;
            if (llmResult.counterGroupId && confidence >= 85) {
              console.log(`✅ Linking new group to counter (confidence: ${confidence}%)`);
              await updateCounterLinks(freshGroup, llmResult.counterGroupId);
            } else if (llmResult.counterGroupId && confidence < 85) {
              console.log(`❌ Counter-match rejected - confidence ${confidence}% < 85% threshold`);
            } else if (vectorCounter) {
              console.log(`ℹ️ Vector found match but LLM rejected it (confidence: ${confidence}%) — not linking`);
            } else {
              console.log(`ℹ️ No valid counter-match found (confidence: ${confidence}%)`);
            }
          });
        });
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
