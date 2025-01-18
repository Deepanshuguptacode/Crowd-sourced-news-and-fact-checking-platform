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


module.exports = { addCommunityComment, addExpertComment };
