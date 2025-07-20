// Off-topic comment detection service using existing LLM service
const DebateRoom = require('../models/DebateRoom');
const llmService = require('./llmService');

class OffTopicDetectionService {
  /**
   * Check if a comment is off-topic for a debate room
   * @param {string} comment - The comment text to check
   * @param {string} roomId - The debate room ID
   * @returns {Promise<{isOffTopic: boolean, reason: string, label: string}>}
   */
  static async checkOffTopic(comment, roomId) {
    try {
      // Get debate room context
      const room = await DebateRoom.findById(roomId);
      if (!room) {
        return { isOffTopic: false, reason: 'Room not found', label: 'Relevant' };
      }

      // Use existing LLM service for off-topic detection
      return await llmService.analyzeCommentRelevance(comment, room.title, room.description);

    } catch (error) {
      console.error('Error in off-topic detection:', error);
      
      // Final fallback - default to relevant to avoid blocking comments
      return { 
        isOffTopic: false, 
        reason: 'Analysis failed, defaulting to relevant', 
        label: 'Relevant' 
      };
    }
  }

  /**
   * Process existing comments in a debate room
   */
  static async processExistingComments(roomId) {
    try {
      const DebateComment = require('../models/DebateComment');
      const comments = await DebateComment.find({ debateRoomId: roomId });
      
      const results = [];
      for (const comment of comments) {
        const analysis = await this.checkOffTopic(comment.comment, roomId);
        
        // Update comment with off-topic flag if detected
        if (analysis.isOffTopic) {
          comment.isOffTopic = true;
          comment.offTopicReason = analysis.reason;
          comment.topicRelevanceLabel = analysis.label;
          await comment.save();
        }
        
        results.push({
          commentId: comment._id,
          analysis: analysis
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error processing existing comments:', error);
      return [];
    }
  }
}

module.exports = OffTopicDetectionService;
