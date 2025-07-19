// controllers/newsController.js
const News = require('../models/News');
const User = require('../models/NormalUser');
const multer = require('multer');
const path = require('path');

// Setup multer for file uploads (storing screenshots in 'uploads/screenshots/')
const storage = multer.diskStorage({
  // Called once for each file being uploaded, providing an opportunity to
  // modify the destination path for the file.
  //
  // cb(null, path) - Saves the file to the specified path and calls
  // `next()`.
  //
  // cb(err) - Saves the file to the default path and calls `next(err)`.
  //
  // cb(null, false) - Does not save the file to disk and calls `next()`.
  //
  // For more information, see:
  // https://github.com/expressjs/multer#diskstorage
  destination: function (req, file, cb) {
    cb(null, 'uploads/screenshots/');
  },
/**
 * Generates a unique filename for the uploaded file by appending the current timestamp to the original file's extension.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} file - The file object containing information about the uploaded file.
 * @param {Function} cb - A callback function to pass the generated filename.
 */

  filename: function (req, file, cb) {
    
    cb(null, Date.now() + path.extname(file.originalname)); // adding timestamp to filename to avoid collision
  },
});

const upload = multer({ storage: storage }).array('screenshots', 5); // allows up to 5 screenshots

// Controller function to handle the news upload
const uploadNews = async (req, res) => {
  try {
    // Step 1: Check if the user is authenticated (allow all user types)
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // Step 2: Handle Multer file upload
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(500).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: 'Something went wrong during file upload' });
      }

      try {
        // Step 3: Get the form data from the request
        const { title, description, link, imageUrls } = req.body;

        // Step 4: Process image sources (uploaded files + URLs)
        let screenshots = [];
        
        // Add uploaded file paths
        if (req.files && req.files.length > 0) {
          screenshots = req.files.map(file => `/uploads/screenshots/${file.filename}`);
        }
        
        // Add image URLs if provided
        if (imageUrls) {
          try {
            const urls = JSON.parse(imageUrls);
            if (Array.isArray(urls)) {
              // Validate URLs
              const validUrls = urls.filter(url => {
                try {
                  const urlObj = new URL(url);
                  return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
                } catch {
                  return false;
                }
              });
              screenshots = [...screenshots, ...validUrls];
            }
          } catch (parseError) {
            console.error('Error parsing image URLs:', parseError);
          }
        }

        // Step 5: Create a new News document and save it to the database
        const news = new News({
          title,
          description,
          link,
          screenshots: screenshots,
          uploadedBy: req.user._id, // Works for all user types
        });

        await news.save();

        // Step 6: Respond with the saved news article
        res.status(201).json({
          message: 'News uploaded successfully',
          news: news,
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        res.status(500).json({ 
          message: 'Error saving news to database', 
          error: dbError.message 
        });
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Error uploading news', error: err.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    // Import comment models and user models
    const { CommunityComment, ExpertComment } = require('../models/Comments');
    const CommunityUser = require('../models/CommunityUser');
    const ExpertUser = require('../models/ExpertUser');
    const NormalUser = require('../models/NormalUser');
    
    // Fetch all news articles
    let news = await News.find()
      .sort({ uploadedAt: -1 }); // Sort by latest uploaded news

    // Manually populate uploadedBy field for different user types and get comments
    const newsWithComments = await Promise.all(
      news.map(async (newsItem) => {
        // Find the user across all user types
        let uploader = await NormalUser.findById(newsItem.uploadedBy);
        if (!uploader) {
          uploader = await CommunityUser.findById(newsItem.uploadedBy);
        }
        if (!uploader) {
          uploader = await ExpertUser.findById(newsItem.uploadedBy);
        }

        // Populate vote arrays across all user types  
        const upvotes = [];
        const downvotes = [];
        
        for (const voteId of newsItem.upvotes) {
          let voter = await NormalUser.findById(voteId, 'name username');
          if (!voter) voter = await CommunityUser.findById(voteId, 'name username');
          if (!voter) voter = await ExpertUser.findById(voteId, 'name username');
          if (voter) upvotes.push(voter);
        }
        
        for (const voteId of newsItem.downvotes) {
          let voter = await NormalUser.findById(voteId, 'name username');
          if (!voter) voter = await CommunityUser.findById(voteId, 'name username');
          if (!voter) voter = await ExpertUser.findById(voteId, 'name username');
          if (voter) downvotes.push(voter);
        }

        // Fetch community comments
        const communityComments = await CommunityComment.find({ newsId: newsItem._id })
          .populate('commenter', 'username')
          .sort({ createdAt: -1 });

        // Fetch expert comments
        const expertComments = await ExpertComment.find({ newsId: newsItem._id })
          .populate('expert', 'username')
          .sort({ createdAt: -1 });

        // Structure the news item with comments and populated fields
        return {
          ...newsItem.toObject(),
          uploadedBy: uploader || { username: 'Unknown', name: 'Unknown User' },
          upvotes: upvotes,
          downvotes: downvotes,
          comments: {
            community: communityComments,
            expert: expertComments
          }
        };
      })
    );

    // Respond with the fetched news articles
    res.status(200).json({
      message: 'News posts fetched successfully',
      news: newsWithComments,
    });
  } catch (err) {
    console.error('Error fetching news posts:', err);
    res.status(500).json({
      message: 'Error fetching news posts',
      error: err.message,
    });
  }
};

// Vote on a news post
const voteNews = async (req, res) => {
  try {
    const { postId } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const userId = req.user.id;

    // Find the post
    const post = await News.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Remove user from both upvotes and downvotes
    post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
    // Add user to the appropriate vote type
    if (voteType === 'upvote') {
      post.upvotes.push(userId);
      // console.log(post.upvotes);
    } else if (voteType === 'downvote') {
      post.downvotes.push(userId);
      // console.log(post.downvotes);
    }

    await post.save();
    
    res.status(200).json({
      message: 'Vote registered successfully',
      upvotes: post.upvotes.length,
      downvotes: post.downvotes.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error voting on post', error: err.message });
  }
};

// Get combined feed (regular news + reposts from trending news)
const getCombinedFeed = async (req, res) => {
  try {
    const { CommunityComment, ExpertComment } = require('../models/Comments');
    const TrendingNews = require('../models/TrendingNews');
    const CommunityUser = require('../models/CommunityUser');
    const ExpertUser = require('../models/ExpertUser');
    const NormalUser = require('../models/NormalUser');
    
    // Fetch regular news posts
    const news = await News.find()
      .populate('uploadedBy', 'name username')
      .populate('upvotes', 'name username')
      .populate('downvotes', 'name username')
      .sort({ uploadedAt: -1 });

    // Fetch trending news with reposts
    const trendingNews = await TrendingNews.find({ 
      isActive: true,
      'reposts.0': { $exists: true } // Only get trending news that have reposts
    })
    .populate('reposts.userId', 'username email name')
    .sort({ fetchedAt: -1 });

    // Convert regular news to feed format
    const newsFeedItems = await Promise.all(
      news.map(async (newsItem) => {
        const communityComments = await CommunityComment.find({ newsId: newsItem._id })
          .populate('commenter', 'username')
          .sort({ createdAt: -1 });

        const expertComments = await ExpertComment.find({ newsId: newsItem._id })
          .populate('expert', 'username')
          .sort({ createdAt: -1 });

        return {
          ...newsItem.toObject(),
          feedType: 'news',
          timestamp: newsItem.uploadedAt,
          comments: {
            community: communityComments,
            expert: expertComments
          }
        };
      })
    );

    // Convert reposts to feed format
    const repostFeedItems = [];
    for (const trendingItem of trendingNews) {
      for (const repost of trendingItem.reposts) {
        repostFeedItems.push({
          _id: `repost_${trendingItem._id}_${repost._id}`,
          feedType: 'repost',
          timestamp: repost.repostedAt,
          repostedBy: repost.userId,
          repostComment: repost.comment,
          originalNews: {
            _id: trendingItem._id,
            title: trendingItem.title,
            description: trendingItem.description,
            link: trendingItem.link,
            image: trendingItem.image,
            source: trendingItem.source,
            category: trendingItem.category
          },
          upvotes: [], // Reposts don't have votes yet
          downvotes: [],
          comments: { community: [], expert: [] } // Reposts don't have comments yet
        });
      }
    }

    // Combine and sort by timestamp
    const combinedFeed = [...newsFeedItems, ...repostFeedItems]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      message: 'Combined feed fetched successfully',
      news: combinedFeed,
      stats: {
        newsCount: newsFeedItems.length,
        repostCount: repostFeedItems.length,
        totalCount: combinedFeed.length
      }
    });
  } catch (error) {
    console.error('Error fetching combined feed:', error);
    res.status(500).json({
      message: 'Failed to fetch combined feed',
      error: error.message
    });
  }
};

module.exports = {
  uploadNews,
  getAllPosts,
  getCombinedFeed,
  voteNews,
};
