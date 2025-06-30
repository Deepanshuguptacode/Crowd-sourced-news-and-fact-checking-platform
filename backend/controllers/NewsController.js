import News from '../models/News.js';
import User from '../models/NormalUser.js';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import { uploadOnCloudinary } from '../utils/uploadOnCloud.js';
import dotenv from 'dotenv';
dotenv.config();
// Setup multer for file uploads (storing screenshots in 'uploads/screenshots/')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/screenshots/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // adding timestamp to filename to avoid collision
  },
});

const upload = multer({ storage: storage }).array('screenshots', 5); // allows up to 5 screenshots

const getAiReview = async (text)=>{
const url = process.env.MODEL_URL ;
if (!url) return null;
try{
const response = await axios.post(url,{text});
if(!response.error){
  return response;
}
} catch(err){
  return null;
}
}
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

      // Upload each file to Cloudinary and collect URLs
      let screenshots = [];
      console.log(req.files)
      for (const file of req.files) {
        const normalizedPath = file.path.replace(/\\/g, '/');
        const result = await uploadOnCloudinary(normalizedPath);
        console.log(result);
        if (result && result.secure_url) {
          screenshots.push(result.secure_url);
        }
      }
      // Step 4: Create a new News document and save it to the database
      const news = new News({
        title,
        description,
        link,
        screenshots,
        uploadedBy: req.user._id, // assuming the user is in the req.user object (set by middleware)
      });

      const response = await getAiReview(title+" "+description);
      if(response){
        // console.log(response.data)
      news.aiReview = response?.data?.prediction
      news.confidence = response?.data?.confidence
       }   
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
    const news = await News.find()
      .populate('uploadedBy', 'name username')
      .populate({
        path: 'comments.community',
        select: 'comment',
        populate: { path: 'commenter', select: 'username name' }
      })
      .populate({
        path: 'comments.expert',
        select: 'comment',
        populate: { path: 'expert', select: 'username name' }
      })
      // .populate('upvotes', 'name username')
      // .populate('downvotes', 'name username')
      .sort({ uploadedAt: -1 });
    
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

    // added to update status
if(post.upvotes>=12 || post.downvotes >=12 ){
  if(post.upvotes-post.downvote > 12) post.status = "Verified";
  else post.status = "fake";
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

export {
  uploadNews,
  getAllPosts,
  voteNews,
};
