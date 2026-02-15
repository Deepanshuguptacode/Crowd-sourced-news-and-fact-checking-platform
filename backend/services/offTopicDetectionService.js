// Off-topic comment detection service — vector-first, LLM fallback
const DebateRoom = require('../models/DebateRoom');
const vectorService = require('./vectorService');
const llmService = require('./llmService');

class OffTopicDetectionService {
  /**
   * Check if a comment is off-topic for a debate room.
   * 1) Fast path: vectorService cosine similarity check  (~50ms)
   * 2) Fallback:  LLM analysis if vector service unavailable
   */
  static async checkOffTopic(commentText, roomId) {
    try {
      // Ensure the room's topic vector exists in Pinecone
      await this._ensureTopicVector(roomId);

      // Fast vector check
      const vecResult = await vectorService.checkTopicRelevance(commentText, roomId);
      if (vecResult && vecResult.score !== 1) {
        // We got a real score from Pinecone — use it
        return {
          isOffTopic: vecResult.isOffTopic,
          reason: `Similarity score ${vecResult.score.toFixed(3)} → ${vecResult.label}`,
          label: vecResult.label,
        };
      }

      // Fallback: topic vector not in Pinecone yet, or Pinecone disabled — use LLM
      const room = await DebateRoom.findById(roomId).lean();
      if (!room) return { isOffTopic: false, reason: 'Room not found', label: 'Relevant' };

      return await llmService.analyzeCommentRelevance(commentText, room.title, room.description);
    } catch (error) {
      console.error('Error in off-topic detection:', error.message);
      return { isOffTopic: false, reason: 'Analysis failed, defaulting to relevant', label: 'Relevant' };
    }
  }

  /**
   * Lazily store the debate room's topic embedding if we haven't yet.
   */
  static async _ensureTopicVector(roomId) {
    // Quick check — avoid repeated DB lookups by caching in-process
    if (!this._topicCache) this._topicCache = new Set();
    if (this._topicCache.has(String(roomId))) return;

    try {
      const room = await DebateRoom.findById(roomId).select('title description').lean();
      if (room) {
        const stored = await vectorService.storeDebateTopic(roomId, room.title, room.description);
        if (stored) {
          this._topicCache.add(String(roomId));
        }
      }
    } catch (err) {
      // Non-fatal — vector check will fall through to LLM
      console.error('Failed to store topic vector:', err.message);
    }
  }

  /**
   * Process existing comments in a debate room
   */
  static async processExistingComments(roomId) {
    try {
      const DebateComment = require('../models/DebateComment');
      const comments = await DebateComment.find({ debateRoomId: roomId }).lean();

      const results = [];
      for (const comment of comments) {
        const analysis = await this.checkOffTopic(comment.text, roomId);

        if (analysis.isOffTopic) {
          await DebateComment.findByIdAndUpdate(comment._id, {
            isOffTopic: true,
            offTopicReason: analysis.reason,
            topicRelevanceLabel: analysis.label,
          });
        }

        results.push({ commentId: comment._id, analysis });
      }
      return results;
    } catch (error) {
      console.error('Error processing existing comments:', error);
      return [];
    }
  }
}

module.exports = OffTopicDetectionService;
