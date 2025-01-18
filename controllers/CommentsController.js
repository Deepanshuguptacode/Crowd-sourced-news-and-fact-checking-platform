const { CommunityComment, ExpertComment } = require('../models/Comments');
const News = require('../models/News');

const addCommunityComment = async (req, res) => {
  try {
    const { newsId, comment } = req.body;

    // Check if news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Create the comment
    const newComment = new CommunityComment({
      newsId,
      commenter: req.user.id,
      comment,
    });

    await newComment.save();
    news.comments.push(newComment._id);
    await news.save();

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
    const { newsId, comment } = req.body;

    // Check if news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Create the comment
    const newComment = new ExpertComment({
      newsId,
      expert: req.user.id,
      comment,
    });

    await newComment.save();
    news.comments.push(newComment._id);
    // Add missing save step
    await news.save();

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
    const { newsId } = req.params;
    const comments = await CommunityComment.find( newsId)
      .populate('commenter', 'username') // Populate commenter details
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
    const { newsId } = req.params;
    const comments = await ExpertComment.find( newsId)
      .populate('expert', 'username') // Populate commenter details
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

module.exports = { addCommunityComment, addExpertComment ,getAllCommunityComments,getAllExpertComments};
