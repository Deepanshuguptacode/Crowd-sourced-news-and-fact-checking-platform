/**
 * DebateCommentController  (ideal-counter approach)
 *
 * Flow per comment (blocking path):
 *   1. generateEmbedding(text)               → 1 embedding call (~200 ms)
 *   2. checkTopicRelevance (reuses embedding) → 0 extra calls   (~50 ms)
 *   3. matchDebateComment  (reuses embedding) → 0 extra calls   (~50 ms)
 *      • Hit  → add comment to group          → 0 LLM calls
 *      • Miss → classifyAndGenerateContent    → 1 LLM call      (~1 s)
 *   4. Background (non-blocking):
 *      • generateGroupContent → title + desc + 2 ideal counters
 *      • storeDebateGroup
 *      • findCounterByIdealMatch → embed ideal counters against opposing groups
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
 * Add bidirectional counter-group links (many-to-many).
 * Groups can link to multiple counter-groups, and links are NEVER removed.
 * Once linked, groups stay linked forever.
 */
async function addCounterLink(group, newCounterId, score = null) {
  const groupId = group._id.toString();

  console.log(`\n🔗 [MANY-TO-MANY LINK] Adding counter-link:`);
  console.log(`   Group ID: ${groupId}`);
  console.log(`   New Counter: ${newCounterId}`);
  console.log(`   Score: ${score?.toFixed(3) || 'N/A'}`);

  // Check if link already exists
  const existingLink = group.counterGroups?.find(
    link => link.groupId?.toString() === newCounterId
  );

  if (existingLink) {
    console.log(`   ℹ️ Link already exists (linked at ${existingLink.linkedAt}), skipping`);
    
    // Also maintain legacy field for backward compatibility (use first/best link)
    if (!group.counterGroupId) {
      await DebateGroup.findByIdAndUpdate(groupId, { 
        counterGroupId: newCounterId, 
        counterMatchScore: score 
      });
    }
    return false;
  }

  // Verify counter group exists
  const counterGroup = await DebateGroup.findById(newCounterId);
  if (!counterGroup) {
    console.log(`   ❌ ERROR: Counter group ${newCounterId} not found in database!`);
    return false;
  }

  console.log(`   📋 Counter group exists: "${counterGroup.title}" (stance: ${counterGroup.stance})`);

  // Add link to current group's counterGroups array
  console.log(`   🔨 Adding link to group ${groupId}...`);
  const update1 = await DebateGroup.findByIdAndUpdate(
    groupId,
    { 
      $push: { 
        counterGroups: { 
          groupId: newCounterId, 
          matchScore: score,
          linkedAt: new Date()
        } 
      },
      // Also update legacy fields for backward compatibility (first link or highest score)
      $set: !group.counterGroupId ? {
        counterGroupId: newCounterId,
        counterMatchScore: score
      } : {}
    },
    { new: true }
  );
  console.log(`   ✅ Added link to ${groupId}.counterGroups[] (array length: ${update1?.counterGroups?.length || 0})`);

  // Add reciprocal link to counter group's counterGroups array
  console.log(`   🔨 Adding reciprocal link to group ${newCounterId}...`);
  const update2 = await DebateGroup.findByIdAndUpdate(
    newCounterId,
    { 
      $push: { 
        counterGroups: { 
          groupId: groupId, 
          matchScore: score,
          linkedAt: new Date()
        } 
      },
      // Also update legacy fields
      $set: !counterGroup.counterGroupId ? {
        counterGroupId: groupId,
        counterMatchScore: score
      } : {}
    },
    { new: true }
  );
  console.log(`   ✅ Added reciprocal link to ${newCounterId}.counterGroups[] (array length: ${update2?.counterGroups?.length || 0})`);

  // Verify the links were actually saved
  const verifyGroup = await DebateGroup.findById(groupId).select('counterGroups counterGroupId counterMatchScore');
  const verifyCounter = await DebateGroup.findById(newCounterId).select('counterGroups counterGroupId counterMatchScore');
  
  console.log(`   📋 Verification - Group ${groupId}:`);
  console.log(`      counterGroups.length: ${verifyGroup?.counterGroups?.length || 0}`);
  console.log(`      counterGroupId (legacy): ${verifyGroup?.counterGroupId || 'NULL'}`);
  console.log(`      counterMatchScore (legacy): ${verifyGroup?.counterMatchScore || 'NULL'}`);
  
  console.log(`   📋 Verification - Group ${newCounterId}:`);
  console.log(`      counterGroups.length: ${verifyCounter?.counterGroups?.length || 0}`);
  console.log(`      counterGroupId (legacy): ${verifyCounter?.counterGroupId || 'NULL'}`);
  console.log(`      counterMatchScore (legacy): ${verifyCounter?.counterMatchScore || 'NULL'}`);
  
  console.log(`   ✅ Linked: ${groupId} ↔ ${newCounterId} (score: ${score?.toFixed(3) || 'N/A'})`);
  console.log(`✅ [MANY-TO-MANY LINK] Link added successfully\n`);
  
  return true;
}

/**
 * Background task: regenerate group content (title, desc, ideal counters),
 * store embeddings, and find counter-group via ideal counter matching.
 * 
 * @param {Object} group           - the debate group
 * @param {string} roomId          - debate room ID
 * @param {string} stance          - 'for' | 'against'
 * @param {Object} debateRoom      - the debate room object
 * @param {Array}  commentEmbedding - the triggering comment's embedding vector
 */
async function backgroundRefreshGroup(group, roomId, stance, debateRoom, commentEmbedding) {
  geminiKeyRotation.advanceKey();
  const allComments = await DebateComment.find({ _id: { $in: group.commentIds } });
  const opposingStance = stance === 'for' ? 'against' : 'for';

  // Single LLM call: regenerate title/description + ideal counters
  const llmResult = await llmService.generateGroupContent(allComments);
  group.title = llmResult.title;
  group.description = llmResult.description;
  group.idealCounters = llmResult.idealCounters || [];
  await group.save();

  // Store group embedding in Pinecone
  await vectorService.storeDebateGroup(group._id, llmResult.title, llmResult.description, roomId, stance);

  // Store ideal counter embeddings
  if (llmResult.idealCounters && llmResult.idealCounters.length > 0) {
    geminiKeyRotation.advanceKey();
    await vectorService.storeIdealCounters(group._id, llmResult.idealCounters, roomId, stance);
  }

  // Find counter-group via ideal counter matching (using original comment embedding)
  if (commentEmbedding) {
    geminiKeyRotation.advanceKey();
    const counterMatch = await vectorService.findCounterByCombinedMatch(
      group._id, commentEmbedding, roomId, opposingStance
    );

    console.log(`\n📊 [COUNTER DEBUG] Combined counter match result for "${llmResult.title}":`);
    console.log(`   Group ID: ${group._id}`);
    console.log(`   Stance: ${group.stance}`);
    console.log(`   Match Found: ${counterMatch ? 'YES' : 'NO'}`);
    if (counterMatch) {
      console.log(`   Counter Group ID: ${counterMatch.counterGroupId}`);
      console.log(`   Combined Score: ${(counterMatch.score * 100).toFixed(2)}%`);
      console.log(`   Ideal Score: ${(counterMatch.idealScore * 100).toFixed(2)}%`);
      console.log(`   Direct Score: ${(counterMatch.directScore * 100).toFixed(2)}%`);
      console.log(`   Best Score: ${(counterMatch.bestScore * 100).toFixed(2)}%`);
      console.log(`   Passes Threshold: ${counterMatch.passesThreshold ? 'YES ✅' : 'NO ❌'}`);
    }

    // Add counter-link (only if passes threshold, never delink)
    await withRoomLock(roomId, async () => {
      const freshGroup = await DebateGroup.findById(group._id);
      if (!freshGroup) {
        console.log(`   ❌ Group not found when trying to add link`);
        return;
      }

      console.log(`   📋 Fresh group loaded: "${freshGroup.title}"`);
      console.log(`   Current counter links: ${freshGroup.counterGroups?.length || 0}`);

      if (counterMatch?.counterGroupId && counterMatch.passesThreshold) {
        const newCounterId = counterMatch.counterGroupId;

        console.log(`   ✅ Match passes threshold, attempting to add link...`);
        const scoreToSave = counterMatch.bestScore || counterMatch.score;  // Use bestScore for display
        const linkResult = await addCounterLink(freshGroup, newCounterId, scoreToSave);
        console.log(`   Link add result: ${linkResult ? 'NEW LINK ADDED ✅' : 'ALREADY LINKED'}`);
      } else if (counterMatch?.counterGroupId && !counterMatch.passesThreshold) {
        console.log(`   ⚠️ Found match below threshold - not linking (group ${counterMatch.counterGroupId}, combined: ${(counterMatch.score * 100).toFixed(1)}%)`);
      } else {
        console.log(`   ℹ️ No counter match found for group ${group._id}`);
      }
    });
    console.log(`[COUNTER DEBUG] Counter matching complete\n`);
  } else {
    console.log(`   ⚠️ No comment embedding available for counter-matching`);
  }
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

    // ── 1. LLM-based off-topic detection with context ───────────────────
    console.log(`🔍 Performing LLM-based topic relevance check...`);
    let offTopic = { isOffTopic: false, label: 'Relevant', reason: '', confidence: 1 };
    try {
      // Fetch recent comments for context (last 5 comments from this room)
      const recentComments = await DebateComment.find({ debateRoomId: roomId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('text stance')
        .lean();
      
      console.log(`📋 Found ${recentComments.length} recent comments for context`);
      
      const result = await llmService.analyzeCommentRelevance(
        text,
        debateRoom.title,
        debateRoom.description || '',
        recentComments.reverse() // oldest first for chronological context
      );
      
      if (result) {
        offTopic = result;
        console.log(`📊 Topic relevance: ${offTopic.label} (confidence: ${(offTopic.confidence * 100).toFixed(1)}%)`);
        if (offTopic.isOffTopic) {
          console.log(`❌ Comment is OFF-TOPIC - will skip group matching and counter-linking`);
        }
      }
    } catch (err) { 
      console.log(`⚠️ Topic relevance check failed:`, err.message);
      /* default to relevant */ 
    }

    // ── 2. Generate embedding ONCE — reused for group match ─────────────
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

    // ── 3. save comment ─────────────────────────────────────────────────
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
    console.log(`✅ Comment saved (ID: ${comment._id}, isOffTopic: ${comment.isOffTopic})`);

    // ── 3. SKIP group matching and counter-linking if off-topic ─────────
    if (offTopic.isOffTopic) {
      const totalDuration = Date.now() - startTime;
      console.log(`\n⚠️ OFF-TOPIC COMMENT - Skipping group matching and counter-linking`);
      console.log(`✅ Off-topic comment creation completed (${totalDuration}ms):`);
      console.log(`   Comment ID: ${comment._id}`);
      console.log(`   Relevance: ${offTopic.label} (confidence: ${(offTopic.confidence * 100).toFixed(1)}%)`);
      console.log(`   Reason: ${offTopic.reason}`);
      console.log(`   Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"\n`);
      
      return res.json({
        success: true,
        message: 'Comment posted (marked as off-topic)',
        data: { 
          comment: {
            ...comment.toObject(),
            groupId: null
          },
          isOffTopic: true,
          relevanceLabel: offTopic.label,
          relevanceConfidence: offTopic.confidence,
          relevanceReason: offTopic.reason
        }
      });
    }

    // ── 5. group matching (reuses SAME pre-computed embedding) ──────────
    console.log(`🔍 Comment is on-topic, proceeding with group matching...`);
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

        // Background: regenerate title/description + ideal counters + counter-match
        background(async () => backgroundRefreshGroup(group, roomId, stance, debateRoom, commentEmbedding));
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

      // Single LLM call: classify + generate title/description + ideal counters
      const llmStartTime = Date.now();
      const result = await llmService.classifyAndGenerateContent(text, labels);
      const llmDuration = Date.now() - llmStartTime;
      
      console.log(`✅ LLM classifyAndGenerate completed (${llmDuration}ms)`);
      console.log(`🎯 Result: ${result.shouldCreateNew ? 'NEW GROUP' : 'MATCHED EXISTING'}`);
      console.log(`📝 New Label: "${result.newLabel}"`);
      console.log(`🏷️ Title: "${result.title}"`);
      console.log(`🎯 Ideal counters: ${result.idealCounters?.length || 0}`);

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

        // Background: refresh title/desc + ideal counters + counter-match
        background(async () => backgroundRefreshGroup(group, roomId, stance, debateRoom, commentEmbedding));
      } else {
        // Create brand-new group (title+desc+idealCounters from combined LLM call)
        const title = result.title;
        const description = result.description;
        const idealCounters = result.idealCounters || [];

        // Determine display order for the new group
        let displayOrder = 0;
        const maxOrder = await DebateGroup.findOne({ debateRoomId: roomId, stance }).sort({ displayOrder: -1 });
        displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;

        // Create group
        group = new DebateGroup({
          debateRoomId: roomId,
          label: result.newLabel,
          title,
          description,
          stance,
          commentIds: [comment._id],
          idealCounters,
          counterGroupId: null,
          displayOrder,
        });
        await group.save();

        // AWAIT Pinecone store so the group is visible to future queries
        await vectorService.storeDebateGroup(group._id, title, description, roomId, stance);

        // Store ideal counter embeddings + find counter-match
        background(async () => {
          // Store ideal counter embeddings
          if (idealCounters.length > 0) {
            geminiKeyRotation.advanceKey();
            console.log(`\n📦 [NEW GROUP] Storing ideal counters for new group ${group._id}`);
            await vectorService.storeIdealCounters(group._id, idealCounters, roomId, stance);
          }

          // Find counter-group via combined matching (ideal counters + direct group)
          geminiKeyRotation.advanceKey();
          const opposingStance = stance === 'for' ? 'against' : 'for';
          console.log(`\n🔍 [NEW GROUP] Finding counter for new group ${group._id} (${stance})`);
          const counterMatch = await vectorService.findCounterByCombinedMatch(
            group._id, commentEmbedding, roomId, opposingStance
          );

          console.log(`\n📊 [NEW GROUP COUNTER] Match result:`);
          console.log(`   Group ID: ${group._id}`);
          console.log(`   Match Found: ${counterMatch ? 'YES' : 'NO'}`);
          if (counterMatch) {
            console.log(`   Counter Group ID: ${counterMatch.counterGroupId}`);
            console.log(`   Combined Score: ${(counterMatch.score * 100).toFixed(2)}%`);
            console.log(`   Ideal Score: ${(counterMatch.idealScore * 100).toFixed(2)}%`);
            console.log(`   Direct Score: ${(counterMatch.directScore * 100).toFixed(2)}%`);
            console.log(`   Best Score: ${(counterMatch.bestScore * 100).toFixed(2)}%`);
            console.log(`   Passes Threshold: ${counterMatch.passesThreshold ? 'YES ✅' : 'NO ❌'}`);
          }

          if (counterMatch?.counterGroupId && counterMatch.passesThreshold) {
            await withRoomLock(roomId, async () => {
              const freshGroup = await DebateGroup.findById(group._id);
              if (!freshGroup) {
                console.log(`   ❌ Fresh group not found`);
                return;
              }
              const scoreToSave = counterMatch.bestScore || counterMatch.score;  // Use bestScore for display
              console.log(`   ✅ Match passes threshold, adding link to new group...`);
              const linkResult = await addCounterLink(freshGroup, counterMatch.counterGroupId, scoreToSave);
              console.log(`   Link result: ${linkResult ? 'NEW LINK ADDED ✅' : 'ALREADY LINKED'}`);
            });
          } else if (counterMatch?.counterGroupId && !counterMatch.passesThreshold) {
            console.log(`   ⚠️ Found match below threshold for new group ${group._id} - not linking (combined: ${(counterMatch.score * 100).toFixed(1)}%)`);
          } else {
            console.log(`   ℹ️ No counter match found for new group ${group._id}`);
          }
          console.log(`[NEW GROUP COUNTER] Complete\n`);
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
      
      // Also fetch ungrouped comments for this stance
      const ungrouped = await DebateComment.find({ 
        debateRoomId: roomId, 
        stance,
        groupId: null 
      })
        .populate('author', 'name username _id')
        .sort({ createdAt: -1 })
        .lean();
      
      return res.json({ success: true, data: { groups, ungrouped } });
    }

    const [forGroups, againstGroups, ungroupedComments] = await Promise.all([
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
      // Fetch all ungrouped/off-topic comments
      DebateComment.find({ 
        debateRoomId: roomId, 
        groupId: null 
      })
        .populate('author', 'name username _id')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Split ungrouped by stance
    const ungroupedFor = ungroupedComments.filter(c => c.stance === 'for');
    const ungroupedAgainst = ungroupedComments.filter(c => c.stance === 'against');

    res.json({ 
      success: true, 
      data: { 
        for: forGroups, 
        against: againstGroups,
        ungroupedFor,
        ungroupedAgainst
      } 
    });
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
        // NOTE: We do NOT remove counter-links when deleting groups
        // Counter-links are permanent and never delinked (per user requirement)
        // This may leave orphaned references, but that's intentional
        console.log(`🗑️ Deleting empty group ${group._id} (counter-links preserved)`);
        
        await vectorService.deleteVector(group._id.toString(), vectorService.getNamespaces().DEBATE_GROUPS);
        await vectorService.deleteIdealCounters(group._id.toString());
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
        console.log(`🔄 Undoing comment - deleting empty group: ${group._id} (counter-links preserved)`);
        
        // NOTE: Counter-links are permanent and never delinked (per user requirement)
        await vectorService.deleteVector(group._id.toString(), vectorService.getNamespaces().DEBATE_GROUPS);
        await vectorService.deleteIdealCounters(group._id.toString());
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

/**
 * TEST ENDPOINT: Show anti-comment scores for all groups in a room
 * For debugging ideal counter matching
 */
const testAntiCommentScores = async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log(`\n🧪 [TEST] Testing anti-comment scores for room ${roomId}`);

    const allGroups = await DebateGroup.find({ debateRoomId: roomId, isDeleted: false })
      .sort({ createdAt: 1 });

    if (allGroups.length === 0) {
      return res.json({ success: true, message: 'No groups found in this room' });
    }

    const results = [];

    for (const group of allGroups) {
      console.log(`\n📊 Testing Group ${group._id} (${group.stance}):`);
      console.log(`   Title: "${group.title}"`);
      console.log(`   Ideal Counters: ${group.idealCounters?.length || 0}`);
      
      if (group.idealCounters && group.idealCounters.length > 0) {
        group.idealCounters.forEach((ic, idx) => {
          console.log(`   IC${idx + 1}: "${ic.substring(0, 100)}..." (${ic.split(' ').length} words)`);
        });
      }

      // Get the first comment from this group to use for testing
      const firstComment = await DebateComment.findOne({ groupId: group._id });
      if (!firstComment) {
        console.log(`   ⚠️ No comments in group, skipping`);
        results.push({
          groupId: group._id.toString(),
          title: group.title,
          stance: group.stance,
          error: 'No comments in group',
        });
        continue;
      }

      // Generate embedding for the comment
      geminiKeyRotation.advanceKey();
      const commentEmbedding = await vectorService.generateEmbedding(firstComment.text);
      
      if (!commentEmbedding) {
        console.log(`   ❌ Failed to generate embedding`);
        results.push({
          groupId: group._id.toString(),
          title: group.title,
          stance: group.stance,
          error: 'Failed to generate embedding',
        });
        continue;
      }

      // Find counter matches using ideal counter matching
      const opposingStance = group.stance === 'for' ? 'against' : 'for';
      geminiKeyRotation.advanceKey();
      const counterMatch = await vectorService.findCounterByIdealMatch(
        group._id,
        commentEmbedding,
        roomId,
        opposingStance
      );

      const matchInfo = counterMatch ? {
        counterGroupId: counterMatch.counterGroupId,
        avgScore: (counterMatch.score * 100).toFixed(2) + '%',
        bestScore: (counterMatch.bestScore * 100).toFixed(2) + '%',
        passesThreshold: counterMatch.passesThreshold,
        currentlyLinked: group.counterGroupId?.toString() === counterMatch.counterGroupId,
        savedScore: group.counterMatchScore ? (group.counterMatchScore * 100).toFixed(2) + '%' : null,
      } : null;

      console.log(`   Result: ${matchInfo ? `Match found (${matchInfo.avgScore} avg, ${matchInfo.bestScore} best, passes: ${matchInfo.passesThreshold})` : 'No match'}`);

      results.push({
        groupId: group._id.toString(),
        title: group.title,
        stance: group.stance,
        idealCountersCount: group.idealCounters?.length || 0,
        currentCounterGroupId: group.counterGroupId?.toString() || null,
        testMatch: matchInfo,
      });
    }

    console.log(`\n✅ [TEST] Completed anti-comment score testing for ${allGroups.length} groups`);

    res.json({
      success: true,
      data: {
        roomId,
        totalGroups: allGroups.length,
        results,
      },
    });
  } catch (error) {
    console.error('❌ [TEST] Error testing anti-comment scores:', error);
    res.status(500).json({ success: false, message: 'Failed to test anti-comment scores', error: error.message });
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
  testAntiCommentScores,
};
