const { CommentFilter, CommentGroup } = require('../models/CommentFilter');
const llmService = require('./llmService');

class CommentFilteringService {
  
  async processComment(commentText, originalCommentId, commentType, newsId) {
    try {
      // Get existing groups for this news item with descriptions
      const existingGroups = await CommentGroup.find({ newsId });

      // Classify the comment using both labels and descriptions
      const classification = await llmService.classifyCommentWithDescriptions(commentText, existingGroups);
      
      let group = null;

      if (classification.matchedGroup) {
        // Find existing group
        group = await CommentGroup.findOne({ 
          label: classification.matchedGroup, 
          newsId 
        });
        
        // Update label if needed
        if (classification.newLabel && classification.newLabel !== classification.matchedGroup) {
          group.label = classification.newLabel;
          await group.save();
        }
      } else if (classification.shouldCreateNew) {
        // Create new group
        // Generate description for the new group
        const description = await llmService.generateGroupDescription(commentText);
        
        group = new CommentGroup({
          label: classification.newLabel,
          description: description || `Group discussing: ${classification.newLabel}`,
          newsId,
          embedding: [], // TODO: Add embedding generation
          comments: []
        });
        await group.save();
      }

      // Create the filtered comment entry
      const commentFilter = new CommentFilter({
        text: commentText,
        originalCommentId,
        commentType,
        newsId,
        embedding: [], // TODO: Add embedding generation
        groupId: group ? group._id : null
      });

      await commentFilter.save();

      // Add comment to group
      if (group) {
        group.comments.push(commentFilter._id);
        await group.save();

        // Check if group now has 3 or more comments and regenerate name and description
        if (group.comments.length >= 3) {
          await this.regenerateGroupNameAndDescriptionIfNeeded(group);
        }
      }

      return {
        success: true,
        commentFilter,
        group
      };

    } catch (error) {
      console.error('Error processing comment for filtering:', error);
      throw error;
    }
  }

  async getGroupedComments(newsId) {
    try {
      // Updated to work with direct CommentGroup population
      const groups = await CommentGroup.find({ newsId, comments: { $ne: [] } })
        .populate({
          path: 'comments',
          populate: {
            path: 'commenter',
            select: 'username fullName'
          }
        })
        .sort({ createdAt: -1 });

      // Map to frontend-expected structure
      return groups.map(group => ({
        _id: group._id,
        label: group.label,
        description: group.description,
        newsId: group.newsId,
        createdAt: group.createdAt,
        commentCount: group.comments.length,
        comments: group.comments.map(comment => ({
          _id: comment._id,
          text: comment.comment, // Map 'comment' field to 'text' for frontend
          commentType: 'community', // Since these are all community comments
          username: comment.commenter?.username || 'Anonymous',
          userFullName: comment.commenter?.fullName || 'Unknown User',
          createdAt: comment.createdAt
        }))
      }));
    } catch (error) {
      console.error('Error fetching grouped comments:', error);
      throw error;
    }
  }

  async getAllFilteredComments(newsId) {
    try {
      const comments = await CommentFilter.find({ newsId })
        .populate('groupId')
        .sort({ createdAt: -1 });

      return comments;
    } catch (error) {
      console.error('Error fetching filtered comments:', error);
      throw error;
    }
  }

  async getCommentsByGroup(groupId) {
    try {
      const group = await CommentGroup.findById(groupId)
        .populate('comments');

      if (!group) {
        throw new Error('Group not found');
      }

      // Populate original comment details
      const populatedComments = await Promise.all(group.comments.map(async (commentFilter) => {
        let originalComment = null;
        
        // Populate based on comment type
        if (commentFilter.commentType === 'community') {
          originalComment = await require('../models/Comments').CommunityComment
            .findById(commentFilter.originalCommentId)
            .populate('commenter', 'username name');
        } else if (commentFilter.commentType === 'expert') {
          originalComment = await require('../models/Comments').ExpertComment
            .findById(commentFilter.originalCommentId)
            .populate('expert', 'username name');
        }

        return {
          _id: commentFilter._id,
          text: commentFilter.text || 'No comment text',
          commentType: commentFilter.commentType,
          createdAt: commentFilter.createdAt,
          originalComment: originalComment,
          // Flatten user data for easier frontend access
          username: commentFilter.commentType === 'expert' 
            ? (originalComment?.expert?.username || 'Unknown Expert')
            : (originalComment?.commenter?.username || 'Unknown User'),
          userFullName: commentFilter.commentType === 'expert' 
            ? (originalComment?.expert?.name || 'Unknown Expert')
            : (originalComment?.commenter?.name || 'Unknown User')
        };
      }));

      return {
        _id: group._id,
        label: group.label,
        newsId: group.newsId,
        createdAt: group.createdAt,
        comments: populatedComments,
        commentCount: populatedComments.length
      };
    } catch (error) {
      console.error('Error fetching comments by group:', error);
      throw error;
    }
  }

  async updateGroupLabel(groupId, newLabel) {
    try {
      const group = await CommentGroup.findByIdAndUpdate(
        groupId,
        { label: newLabel },
        { new: true }
      );

      return group;
    } catch (error) {
      console.error('Error updating group label:', error);
      throw error;
    }
  }

  async updateGroupDescription(groupId, newDescription) {
    try {
      const group = await CommentGroup.findByIdAndUpdate(
        groupId,
        { description: newDescription },
        { new: true }
      );

      return group;
    } catch (error) {
      console.error('Error updating group description:', error);
      throw error;
    }
  }

  async deleteGroup(groupId) {
    try {
      // Remove group reference from all comments in the group
      await CommentFilter.updateMany(
        { groupId },
        { $unset: { groupId: 1 } }
      );

      // Delete the group
      await CommentGroup.findByIdAndDelete(groupId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  async regenerateGroupNameAndDescriptionIfNeeded(group) {
    try {
      // Get all comments in this group
      const groupWithComments = await CommentGroup.findById(group._id)
        .populate('comments');

      if (!groupWithComments || groupWithComments.comments.length < 3) {
        return; // Not enough comments to regenerate
      }

      // Extract comment texts
      const commentTexts = groupWithComments.comments.map(comment => comment.text);
      
      // Generate new group name and description based on all comments
      const [newGroupName, newDescription] = await Promise.all([
        llmService.regenerateGroupName(commentTexts, group.label),
        llmService.generateGroupDescription(commentTexts.join(' | '))
      ]);
      
      let updated = false;
      
      // Update group name if it's different
      if (newGroupName && newGroupName !== group.label) {
        console.log(`Updating group name from "${group.label}" to "${newGroupName}"`);
        group.label = newGroupName;
        updated = true;
      }

      // Update group description
      if (newDescription && newDescription !== group.description) {
        console.log(`Updating group description for "${group.label}"`);
        group.description = newDescription;
        updated = true;
      }

      if (updated) {
        await group.save();
      }

    } catch (error) {
      console.error('Error regenerating group name and description:', error);
      // Don't throw error - this is not critical for the main functionality
    }
  }

  // Method to manually regenerate all group names and descriptions for a news item
  async regenerateAllGroupNames(newsId) {
    try {
      const groups = await CommentGroup.find({ newsId })
        .populate('comments');

      const results = [];

      for (const group of groups) {
        if (group.comments.length >= 2) { // Allow regeneration with 2+ comments for manual trigger
          const commentTexts = group.comments.map(comment => comment.text);
          const oldLabel = group.label;
          const oldDescription = group.description || '';
          
          const [newGroupName, newDescription] = await Promise.all([
            llmService.regenerateGroupName(commentTexts, group.label),
            llmService.generateGroupDescription(commentTexts.join(' | '))
          ]);
          
          let updated = false;
          
          if (newGroupName && newGroupName !== group.label) {
            group.label = newGroupName;
            updated = true;
          }

          if (newDescription && newDescription !== group.description) {
            group.description = newDescription;
            updated = true;
          }

          if (updated) {
            await group.save();
            
            results.push({
              groupId: group._id,
              oldLabel,
              newLabel: group.label,
              oldDescription,
              newDescription: group.description,
              commentCount: group.comments.length
            });
          }
        }
      }

      return {
        success: true,
        updatedGroups: results,
        totalGroupsProcessed: groups.length
      };

    } catch (error) {
      console.error('Error regenerating all group names:', error);
      throw error;
    }
  }

  // Get filtering summary for a news item
  async getFilteringSummary(newsId) {
    try {
      const [groups, totalComments] = await Promise.all([
        CommentGroup.find({ newsId }).populate('comments'),
        CommentFilter.countDocuments({ newsId })
      ]);

      const summary = {
        totalGroups: groups.length,
        totalComments: totalComments,
        ungroupedComments: await CommentFilter.countDocuments({ newsId, groupId: null }),
        groups: groups.map(group => ({
          _id: group._id,
          label: group.label,
          commentCount: group.comments.length,
          createdAt: group.createdAt
        }))
      };

      return summary;
    } catch (error) {
      console.error('Error getting filtering summary:', error);
      throw error;
    }
  }
}

module.exports = new CommentFilteringService();
