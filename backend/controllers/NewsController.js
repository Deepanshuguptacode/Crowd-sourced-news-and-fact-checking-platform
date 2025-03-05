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
    // Step 1: Check if the user is authenticated and is a normal user
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

      // Step 3: Get the form data from the request
      const { title, description, link } = req.body;

      // Step 4: Create a new News document and save it to the database
      const news = new News({
        title,
        description,
        link,
        screenshots: req.files.map(file => `/uploads/screenshots/${file.filename}`),
        uploadedBy: req.user._id, // assuming the user is in the req.user object (set by middleware)
      });

      await news.save();

      // Step 5: Respond with the saved news article
      res.status(201).json({
        message: 'News uploaded successfully',
        news: news,
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Error uploading news', error: err.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    // Fetch all news articles and populate the 'uploadedBy' field to include the user's username
    const news = await News.find()
    //what populate does
    //The populate() function is used to replace the specified path in the document with the document from other collection. It is used to link documents from other collections.
      .populate('comments','name username comment')// Populate comments
      .populate('uploadedBy', 'name username')// Populate uploader's username
      .populate('upvotes', 'name username') // Populate upvoters' usernames
      .populate('downvotes', 'name username') // Populate downvoters' usernames
      .sort({ uploadedAt: -1 }); // Sort by latest uploaded news

    // Respond with the fetched news articles

    res.status(200).json({
      message: 'News posts fetched successfully',
      news,
    });
  } catch (err) {
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

module.exports = {
  uploadNews,
  getAllPosts,
  voteNews,
};
