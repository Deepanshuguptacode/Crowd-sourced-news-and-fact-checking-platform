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

module.exports = {
  uploadNews,
};
