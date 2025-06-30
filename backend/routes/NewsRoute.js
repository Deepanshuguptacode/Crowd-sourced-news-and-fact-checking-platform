// routes/newsRoutes.js
import express from 'express';
const router = express.Router();
import { uploadNews, getAllPosts, voteNews } from '../controllers/NewsController.js'
// Middleware for authentication (you can implement this based on your auth system)
import { authenticateNormalUser, authenticateCommunityUser, authenticateExpertUser, authenticateCommunityOrExpertUser } from '../middlewares/authMiddleware.js'
import { addCommunityComment, addExpertComment, getAllCommunityComments, getAllExpertComments } from '../controllers/CommentsController.js'
// Route for uploading news (protected route, only authenticated users can upload)
router.post('/upload', authenticateNormalUser , uploadNews);
router.get('/posts',getAllPosts);
router.post('/vote/:postId', authenticateCommunityOrExpertUser, voteNews);
router.post('/community-comment/add', authenticateCommunityUser, addCommunityComment);
router.post('/expert-comment/add', authenticateExpertUser, addExpertComment);
router.post('/community-comment', getAllCommunityComments);
router.post('/expert-comment', getAllExpertComments);

export default router;
