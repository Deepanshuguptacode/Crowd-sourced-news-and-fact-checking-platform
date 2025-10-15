const { CommunityComment, ExpertComment } = require('../models/Comments');
const News = require('../models/News');
const commentFilteringService = require('../services/commentFilteringService');

const addCommunityComment = async (req, res) => {
  try {
    const { newsId, comment, evidenceLinks, stance } = req.body;

    // Check if news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Validate stance if provided
    if (stance && !['in_favor', 'against', 'general'].includes(stance)) {
      return res.status(400).json({ message: 'Invalid stance. Must be in_favor, against, or general' });
    }

    // Validate evidence links if provided
    if (evidenceLinks && evidenceLinks.length > 0) {
      for (const evidence of evidenceLinks) {
        if (!evidence.url || !evidence.explanation) {
          return res.status(400).json({ message: 'Each evidence link must have both URL and explanation' });
        }
        if (evidence.explanation.length > 500) {
          return res.status(400).json({ message: 'Evidence explanation must be 500 characters or less' });
        }
      }
    }

    // Create the comment
    const newComment = new CommunityComment({
      newsId,
      commenter: req.user.id,
      comment,
      evidenceLinks: evidenceLinks || [],
      stance: stance || 'general' // Default to general if not provided
    });

    await newComment.save();
    news.comments.push(newComment._id);
    await news.save();

    // Process comment for filtering
    try {
      await commentFilteringService.processComment(
        comment,
        newComment._id,
        'community',
        newsId
      );
    } catch (filterError) {
      console.error('Error processing comment for filtering:', filterError);
      // Don't fail the main comment creation if filtering fails
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};


const addExpertComment = async (req, res) => {
  try {
    const { newsId, comment, evidenceLinks, stance } = req.body;

    // Check if news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Validate stance if provided
    if (stance && !['in_favor', 'against', 'general'].includes(stance)) {
      return res.status(400).json({ message: 'Invalid stance. Must be in_favor, against, or general' });
    }

    // Validate evidence links if provided
    if (evidenceLinks && evidenceLinks.length > 0) {
      for (const evidence of evidenceLinks) {
        if (!evidence.url || !evidence.explanation) {
          return res.status(400).json({ message: 'Each evidence link must have both URL and explanation' });
        }
        if (evidence.explanation.length > 500) {
          return res.status(400).json({ message: 'Evidence explanation must be 500 characters or less' });
        }
      }
    }

    // Create the comment
    const newComment = new ExpertComment({
      newsId,
      expert: req.user.id,
      comment,
      evidenceLinks: evidenceLinks || [],
      stance: stance || 'general' // Default to general if not provided
    });

    await newComment.save();
    news.comments.push(newComment._id);
    // Add missing save step
    await news.save();

    // Process comment for filtering
    try {
      await commentFilteringService.processComment(
        comment,
        newComment._id,
        'expert',
        newsId
      );
    } catch (filterError) {
      console.error('Error processing expert comment for filtering:', filterError);
      // Don't fail the main comment creation if filtering fails
    }

    res.status(201).json({
      message: 'Expert comment added successfully',
      comment: newComment,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error adding expert comment', error: err.message });
  }
};

const getAllCommunityComments = async (req, res) => {
  try {
    const { newsId } = req.query;
    const comments = await CommunityComment.find({ newsId })
      .populate('commenter', 'username') // Populate commenter details
      .populate('expertVotes.expert', 'username') // Populate expert voters
      .sort({ createdAt: -1 }); // Sort by newest first

    if (comments.length === 0) {
      return res.status(404).json({ message: 'No comments found for this news' });
    }

    res.status(200).json({
      message: 'Comments fetched successfully',
      comments,
    });
  } catch (err) {
    console.error('Error in getAllComments:', err);
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};

const getAllExpertComments = async (req, res) => {
  try {
    const { newsId } = req.query;
    const comments = await ExpertComment.find({ newsId })
      .populate('expert', 'username') // Populate commenter details
      .populate('expertVotes.expert', 'username') // Populate expert voters
      .sort({ createdAt: -1 }); // Sort by newest first

    if (comments.length === 0) {
      return res.status(404).json({ message: 'No comments found for this news' });
    }

    res.status(200).json({
      message: 'Comments fetched successfully',
      comments,
    });
  } catch (err) {
    console.error('Error in getAllComments:', err);
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};

// Expert voting on community comments
const expertVoteOnCommunityComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType, explanation } = req.body;
    const expertId = req.user.id;

    // Validate input
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Vote type must be either upvote or downvote' });
    }
    
    if (!explanation || explanation.trim().length === 0) {
      return res.status(400).json({ message: 'Explanation is required for expert votes' });
    }
    
    if (explanation.length > 300) {
      return res.status(400).json({ message: 'Explanation must be 300 characters or less' });
    }

    // Find the comment
    const comment = await CommunityComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if expert has already voted
    const existingVoteIndex = comment.expertVotes.findIndex(
      vote => vote.expert.toString() === expertId
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote
      const oldVoteType = comment.expertVotes[existingVoteIndex].voteType;
      comment.expertVotes[existingVoteIndex].voteType = voteType;
      comment.expertVotes[existingVoteIndex].explanation = explanation.trim();
      comment.expertVotes[existingVoteIndex].votedAt = new Date();
      
      // Update vote counts
      if (oldVoteType === 'upvote') comment.upvoteCount--;
      else comment.downvoteCount--;
      
      if (voteType === 'upvote') comment.upvoteCount++;
      else comment.downvoteCount++;
    } else {
      // Add new vote
      comment.expertVotes.push({
        expert: expertId,
        voteType,
        explanation: explanation.trim(),
      });
      
      // Update vote counts
      if (voteType === 'upvote') comment.upvoteCount++;
      else comment.downvoteCount++;
    }

    await comment.save();

    res.status(200).json({
      message: 'Vote recorded successfully',
      upvoteCount: comment.upvoteCount,
      downvoteCount: comment.downvoteCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error recording vote', error: err.message });
  }
};

// Expert voting on expert comments
const expertVoteOnExpertComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType, explanation } = req.body;
    const expertId = req.user.id;

    // Validate input
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Vote type must be either upvote or downvote' });
    }
    
    if (!explanation || explanation.trim().length === 0) {
      return res.status(400).json({ message: 'Explanation is required for expert votes' });
    }
    
    if (explanation.length > 300) {
      return res.status(400).json({ message: 'Explanation must be 300 characters or less' });
    }

    // Find the comment
    const comment = await ExpertComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Prevent self-voting
    if (comment.expert.toString() === expertId) {
      return res.status(400).json({ message: 'You cannot vote on your own comment' });
    }

    // Check if expert has already voted
    const existingVoteIndex = comment.expertVotes.findIndex(
      vote => vote.expert.toString() === expertId
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote
      const oldVoteType = comment.expertVotes[existingVoteIndex].voteType;
      comment.expertVotes[existingVoteIndex].voteType = voteType;
      comment.expertVotes[existingVoteIndex].explanation = explanation.trim();
      comment.expertVotes[existingVoteIndex].votedAt = new Date();
      
      // Update vote counts
      if (oldVoteType === 'upvote') comment.upvoteCount--;
      else comment.downvoteCount--;
      
      if (voteType === 'upvote') comment.upvoteCount++;
      else comment.downvoteCount++;
    } else {
      // Add new vote
      comment.expertVotes.push({
        expert: expertId,
        voteType,
        explanation: explanation.trim(),
      });
      
      // Update vote counts
      if (voteType === 'upvote') comment.upvoteCount++;
      else comment.downvoteCount++;
    }

    await comment.save();

    res.status(200).json({
      message: 'Vote recorded successfully',
      upvoteCount: comment.upvoteCount,
      downvoteCount: comment.downvoteCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error recording vote', error: err.message });
  }
};

// Get expert votes for a community comment
const getCommunityCommentVotes = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await CommunityComment.findById(commentId)
      .populate('expertVotes.expert', 'username')
      .select('expertVotes upvoteCount downvoteCount');
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({
      message: 'Votes fetched successfully',
      votes: comment.expertVotes,
      upvoteCount: comment.upvoteCount,
      downvoteCount: comment.downvoteCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching votes', error: err.message });
  }
};

// Get expert votes for an expert comment
const getExpertCommentVotes = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await ExpertComment.findById(commentId)
      .populate('expertVotes.expert', 'username')
      .select('expertVotes upvoteCount downvoteCount');
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({
      message: 'Votes fetched successfully',
      votes: comment.expertVotes,
      upvoteCount: comment.upvoteCount,
      downvoteCount: comment.downvoteCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching votes', error: err.message });
  }
};

module.exports = { 
  addCommunityComment, 
  addExpertComment,
  getAllCommunityComments,
  getAllExpertComments,
  expertVoteOnCommunityComment,
  expertVoteOnExpertComment,
  getCommunityCommentVotes,
  getExpertCommentVotes
};
