const { CommentFilter, CommentGroup } = require('../models/CommentFilter');
const vectorService = require('./vectorService');
const llmService = require('./llmService');

class CommentFilteringService {

  /**
   * Process a new comment: vector match first, LLM fallback.
   */
  async processComment(commentText, originalCommentId, commentType, newsId) {
    try {
      let group = null;

      // ── 1. Fast vector match ──────────────────────────────────────────
      const vecMatch = await vectorService.matchNewsComment(commentText, newsId);

      if (vecMatch) {
        group = await CommentGroup.findById(vecMatch.groupId);
      }

      // ── 2. LLM fallback when vector miss ──────────────────────────────
      if (!group) {
        const existingGroups = await CommentGroup.find({ newsId }).lean();
        const labels = existingGroups.map(g => g.label);

        const classification = await llmService.classifyComment(commentText, labels);

        if (classification.matchedGroup) {
          group = await CommentGroup.findOne({ label: classification.matchedGroup, newsId });
        }

        if (!group && classification.shouldCreateNew) {
          const description = await llmService.generateGroupDescription(commentText);
          group = new CommentGroup({
            label: classification.newLabel,
            description: description || `Group discussing: ${classification.newLabel}`,
            newsId,
            comments: [],
          });
          await group.save();

          // Store in Pinecone (fire-and-forget, graceful fallback)
          vectorService.storeNewsGroup(
            group._id.toString(), group.label, group.description, newsId
          ).catch(err => console.error('Pinecone storeNewsGroup error:', err.message));
        }
      }

      // ── 3. Save filtered comment ──────────────────────────────────────
      const commentFilter = new CommentFilter({
        text: commentText,
        originalCommentId,
        commentType,
        newsId,
        groupId: group?._id || null,
      });
      await commentFilter.save();

      if (group) {
        group.comments.push(commentFilter._id);
        await group.save();

        // Auto-regenerate label when 3+ comments
        if (group.comments.length >= 3) {
          this._regenerateInBackground(group);
        }
      }

      return { success: true, commentFilter, group };
    } catch (error) {
      console.error('Error processing comment for filtering:', error);
      throw error;
    }
  }

  /** Fire-and-forget background regeneration */
  _regenerateInBackground(group) {
    this.regenerateGroupNameAndDescriptionIfNeeded(group).catch(err =>
      console.error('Background regeneration error:', err.message)
    );
  }

  // ====================================================================
  //  READ  OPERATIONS  (lean queries)
  // ====================================================================

  async getGroupedComments(newsId) {
    try {
      const CommunityComment = require('../models/Comments').CommunityComment;
      const ExpertComment = require('../models/Comments').ExpertComment;

      const groups = await CommentGroup.find({ newsId })
        .sort({ createdAt: -1 })
        .lean();

      if (!groups.length) return [];

      // ── Source 1: group.comments array (legacy data — old backend stored
      //   CommunityComment / ExpertComment IDs here directly) ────────────
      // ── Source 2: CommentFilter.groupId (new-backend data) ───────────
      // Merge both so all historic and new comments appear.

      const groupIds = groups.map(g => g._id);

      // Fetch new-style CommentFilter entries (one per comment from new backend)
      const newStyleFilters = await CommentFilter.find({
        groupId: { $in: groupIds },
      }).lean();

      // Build groupId → Set<originalCommentId string> to deduplicate later
      const newStyleByGroup = {};
      const newStyleOrigIds = new Set();
      for (const cf of newStyleFilters) {
        const key = cf.groupId.toString();
        if (!newStyleByGroup[key]) newStyleByGroup[key] = [];
        newStyleByGroup[key].push(cf);
        if (cf.originalCommentId) newStyleOrigIds.add(cf.originalCommentId.toString());
      }

      const result = await Promise.all(
        groups.map(async (group) => {
          const comments = [];
          // seenOrigIds tracks original CommunityComment/ExpertComment IDs only
          // (NOT CommentFilter IDs) so Source B always processes new-style entries
          const seenOrigIds = new Set();

          // ── A. Legacy group.comments (CommunityComment / ExpertComment IDs) ──
          const legacyIds = group.comments || [];
          await Promise.all(legacyIds.map(async (rawId) => {
            const id = rawId.toString();
            if (seenOrigIds.has(id)) return;

            try {
              // Try CommunityComment first (most common in old data)
              let doc = await CommunityComment.findById(rawId)
                .populate('commenter', 'username fullName name _id').lean();
              if (doc) {
                seenOrigIds.add(id);
                // Skip if a new-style CommentFilter entry covers this same comment
                if (!newStyleOrigIds.has(id)) {
                  comments.push({
                    _id: doc._id,
                    originalCommentId: doc._id.toString(),
                    commenterId: doc.commenter?._id?.toString(),
                    text: doc.comment || '',
                    commentType: 'community',
                    stance: doc.stance || 'general',
                    username: doc.commenter?.username || 'Anonymous',
                    userFullName: doc.commenter?.fullName || doc.commenter?.name || 'Unknown User',
                    createdAt: doc.createdAt,
                  });
                }
                return;
              }

              // Try ExpertComment next
              doc = await ExpertComment.findById(rawId)
                .populate('expert', 'username fullName name _id').lean();
              if (doc) {
                seenOrigIds.add(id);
                if (!newStyleOrigIds.has(id)) {
                  comments.push({
                    _id: doc._id,
                    originalCommentId: doc._id.toString(),
                    commenterId: doc.expert?._id?.toString(),
                    text: doc.comment || '',
                    commentType: 'expert',
                    stance: doc.stance || 'general',
                    username: doc.expert?.username || 'Unknown Expert',
                    userFullName: doc.expert?.fullName || doc.expert?.name || 'Unknown Expert',
                    createdAt: doc.createdAt,
                  });
                }
                return;
              }

              // rawId is a CommentFilter ID (new-style stored in old array).
              // Do NOT add to seenOrigIds — Source B handles it.
            } catch (_) {
              // ignore individual lookup errors
            }
          }));

          // ── B. New-style CommentFilter entries (current backend data) ──
          const cfs = newStyleByGroup[group._id.toString()] || [];
          await Promise.all(cfs.map(async (cf) => {
            const origId = cf.originalCommentId?.toString();
            // Skip only if the original comment was already added via legacy path
            if (origId && seenOrigIds.has(origId)) return;

            let orig = null;
            try {
              if (cf.commentType === 'expert') {
                orig = await ExpertComment.findById(cf.originalCommentId)
                  .populate('expert', 'username fullName name _id').lean();
              } else {
                orig = await CommunityComment.findById(cf.originalCommentId)
                  .populate('commenter', 'username fullName name _id').lean();
              }
            } catch (_) {}

            if (origId) seenOrigIds.add(origId);

            comments.push({
              _id: cf._id,
              originalCommentId: origId || cf._id.toString(),
              commenterId: cf.commentType === 'expert'
                ? orig?.expert?._id?.toString()
                : orig?.commenter?._id?.toString(),
              text: cf.text || orig?.comment || '',
              commentType: cf.commentType || 'community',
              stance: orig?.stance || 'general',
              username: cf.commentType === 'expert'
                ? (orig?.expert?.username || 'Unknown Expert')
                : (orig?.commenter?.username || 'Anonymous'),
              userFullName: cf.commentType === 'expert'
                ? (orig?.expert?.fullName || orig?.expert?.name || 'Unknown Expert')
                : (orig?.commenter?.fullName || orig?.commenter?.name || 'Unknown User'),
              createdAt: cf.createdAt || orig?.createdAt,
            });
          }));

          // Skip groups that ended up with zero visible comments
          if (!comments.length) return null;

          // Treat empty or the old "Group discussing: <label>" fallback as no description.
          // Those patterns give users no extra information — showing nothing is cleaner.
          const rawDesc = group.description && group.description.trim();
          const isFallbackDesc = rawDesc &&
            (rawDesc.toLowerCase().startsWith('group discussing:') ||
             rawDesc.toLowerCase() === group.label.toLowerCase());
          const desc = rawDesc && !isFallbackDesc ? rawDesc : null;

          // If description is missing/stale, regenerate it in the background using the
          // comment texts we already have so it's available on the next fetch.
          if (!desc && comments.length > 0) {
            const texts = comments.map(c => c.text).filter(Boolean);
            if (texts.length > 0) {
              llmService.generateGroupDescription(texts.join(' | '))
                .then(newDesc => {
                  if (newDesc && newDesc.trim()) {
                    CommentGroup.findByIdAndUpdate(group._id, { description: newDesc.trim() })
                      .exec()
                      .catch(() => {});
                    vectorService.storeNewsGroup(
                      group._id.toString(), group.label, newDesc.trim(), newsId
                    ).catch(() => {});
                  }
                })
                .catch(() => {});
            }
          }

          return {
            _id: group._id,
            label: group.label,
            description: desc,
            newsId: group.newsId,
            createdAt: group.createdAt,
            commentCount: comments.length,
            comments,
          };
        })
      );

      // Filter out null (empty) groups
      return result.filter(Boolean);
    } catch (error) {
      console.error('Error fetching grouped comments:', error);
      throw error;
    }
  }

  async getAllFilteredComments(newsId) {
    try {
      return await CommentFilter.find({ newsId })
        .populate('groupId')
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      console.error('Error fetching filtered comments:', error);
      throw error;
    }
  }

  async getCommentsByGroup(groupId) {
    try {
      const group = await CommentGroup.findById(groupId)
        .populate('comments')
        .lean();

      if (!group) throw new Error('Group not found');

      const CommunityComment = require('../models/Comments').CommunityComment;
      const ExpertComment = require('../models/Comments').ExpertComment;

      const populatedComments = await Promise.all(
        group.comments.map(async (cf) => {
          let orig = null;
          if (cf.commentType === 'community') {
            orig = await CommunityComment.findById(cf.originalCommentId)
              .populate('commenter', 'username name').lean();
          } else if (cf.commentType === 'expert') {
            orig = await ExpertComment.findById(cf.originalCommentId)
              .populate('expert', 'username name').lean();
          }

          return {
            _id: cf._id,
            text: cf.text || 'No comment text',
            commentType: cf.commentType,
            createdAt: cf.createdAt,
            originalComment: orig,
            username: cf.commentType === 'expert'
              ? (orig?.expert?.username || 'Unknown Expert')
              : (orig?.commenter?.username || 'Unknown User'),
            userFullName: cf.commentType === 'expert'
              ? (orig?.expert?.name || 'Unknown Expert')
              : (orig?.commenter?.name || 'Unknown User'),
          };
        })
      );

      return {
        _id: group._id,
        label: group.label,
        newsId: group.newsId,
        createdAt: group.createdAt,
        comments: populatedComments,
        commentCount: populatedComments.length,
      };
    } catch (error) {
      console.error('Error fetching comments by group:', error);
      throw error;
    }
  }

  // ====================================================================
  //  MUTATIONS
  // ====================================================================

  async updateGroupLabel(groupId, newLabel) {
    const group = await CommentGroup.findByIdAndUpdate(groupId, { label: newLabel }, { new: true });
    // Sync Pinecone
    if (group) {
      vectorService.storeNewsGroup(
        group._id.toString(), group.label, group.description, group.newsId
      ).catch(() => {});
    }
    return group;
  }

  async updateGroupDescription(groupId, newDescription) {
    const group = await CommentGroup.findByIdAndUpdate(groupId, { description: newDescription }, { new: true });
    if (group) {
      vectorService.storeNewsGroup(
        group._id.toString(), group.label, group.description, group.newsId
      ).catch(() => {});
    }
    return group;
  }

  async deleteGroup(groupId) {
    await CommentFilter.updateMany({ groupId }, { $unset: { groupId: 1 } });
    await CommentGroup.findByIdAndDelete(groupId);
    // Remove from Pinecone
    vectorService.deleteVector(groupId, vectorService.getNamespaces().NEWS_GROUPS).catch(() => {});
    return { success: true };
  }

  // ====================================================================
  //  REGENERATION  (name + description)
  // ====================================================================

  async regenerateGroupNameAndDescriptionIfNeeded(group) {
    try {
      const g = await CommentGroup.findById(group._id).populate('comments').lean();
      if (!g || g.comments.length < 3) return;

      const texts = g.comments.map(c => c.text).filter(Boolean);
      const [newName, newDesc] = await Promise.all([
        llmService.regenerateGroupName(texts, g.label),
        llmService.generateGroupDescription(texts.join(' | ')),
      ]);

      const update = {};
      if (newName && newName !== g.label) update.label = newName;
      if (newDesc && newDesc !== g.description) update.description = newDesc;

      if (Object.keys(update).length) {
        await CommentGroup.findByIdAndUpdate(g._id, update);
        // Update Pinecone
        vectorService.storeNewsGroup(
          g._id.toString(), update.label || g.label, update.description || g.description, g.newsId
        ).catch(() => {});
      }
    } catch (error) {
      console.error('Error regenerating group name/desc:', error.message);
    }
  }

  async regenerateAllGroupNames(newsId) {
    try {
      const groups = await CommentGroup.find({ newsId }).populate('comments').lean();
      const results = [];

      for (const g of groups) {
        if (g.comments.length < 2) continue;

        const texts = g.comments.map(c => c.text).filter(Boolean);
        const [newName, newDesc] = await Promise.all([
          llmService.regenerateGroupName(texts, g.label),
          llmService.generateGroupDescription(texts.join(' | ')),
        ]);

        const update = {};
        if (newName && newName !== g.label) update.label = newName;
        if (newDesc && newDesc !== g.description) update.description = newDesc;

        if (Object.keys(update).length) {
          await CommentGroup.findByIdAndUpdate(g._id, update);
          vectorService.storeNewsGroup(
            g._id.toString(), update.label || g.label, update.description || g.description, g.newsId
          ).catch(() => {});

          results.push({
            groupId: g._id,
            oldLabel: g.label, newLabel: update.label || g.label,
            oldDescription: g.description || '', newDescription: update.description || g.description,
            commentCount: g.comments.length,
          });
        }
      }

      return { success: true, updatedGroups: results, totalGroupsProcessed: groups.length };
    } catch (error) {
      console.error('Error regenerating all group names:', error);
      throw error;
    }
  }

  // ====================================================================
  //  SUMMARY
  // ====================================================================

  async getFilteringSummary(newsId) {
    try {
      const [groups, totalComments, ungrouped] = await Promise.all([
        CommentGroup.find({ newsId }).populate('comments').lean(),
        CommentFilter.countDocuments({ newsId }),
        CommentFilter.countDocuments({ newsId, groupId: null }),
      ]);

      return {
        totalGroups: groups.length,
        totalComments,
        ungroupedComments: ungrouped,
        groups: groups.map(g => ({
          _id: g._id,
          label: g.label,
          commentCount: g.comments.length,
          createdAt: g.createdAt,
        })),
      };
    } catch (error) {
      console.error('Error getting filtering summary:', error);
      throw error;
    }
  }
}

module.exports = new CommentFilteringService();
