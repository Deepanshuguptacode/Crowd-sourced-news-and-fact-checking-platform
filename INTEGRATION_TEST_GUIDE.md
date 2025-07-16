# Frontend-Backend Integration Test Guide

## Quick Start Testing

### 1. Start Backend Server
```bash
cd backend
npm start
```
Backend should run on: http://localhost:3000

### 2. Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend should run on: http://localhost:5173

### 3. Test Integration Points

#### Authentication Flow
1. Go to http://localhost:5173
2. Click "Sign Up" or navigate to /signup
3. Try registering with different user types:
   - Normal User (can submit news)
   - Community User (can vote and comment)
   - Expert User (can provide expert opinions)
4. Login with created credentials
5. Verify you're redirected to /home

#### News Functionality
1. **Submit News** (Normal users only):
   - Navigate to /submit-news
   - Fill out the form with title, description, link
   - Upload screenshots (optional)
   - Submit and verify success

2. **View News Feed**:
   - Go to /home
   - Verify news articles load from backend
   - Check that voting buttons appear for community/expert users

3. **Voting** (Community/Expert users):
   - Click upvote/downvote buttons
   - Verify vote counts update
   - Check for success/error messages

4. **Comments** (Community/Expert users):
   - Click on a news article to expand comments
   - Add a comment
   - Verify comment appears and is filtered automatically

#### Comment Filtering (New Feature)
1. **Automatic Grouping**:
   - Add multiple comments with similar topics
   - Check backend logs for filtering process
   - Use filtering API endpoints to see groups

2. **Test Filtering Endpoints**:
   ```bash
   # Get grouped comments for a news item
   curl http://localhost:3000/comment-filter/grouped/{newsId}
   
   # Get filtering summary
   curl http://localhost:3000/comment-filter/summary/{newsId}
   
   # Test integration
   curl http://localhost:3000/comment-filter/test
   ```

### 4. Common Issues and Solutions

#### CORS Errors
- ✅ Fixed with enhanced CORS configuration
- ✅ Vite proxy setup for development
- ✅ Proper credentials handling

#### Authentication Issues
- Check browser cookies/localStorage
- Verify JWT tokens are being set
- Check network tab for 401 errors

#### File Upload Issues
- Verify multer configuration in backend
- Check file size limits (50mb configured)
- Ensure uploads directory exists

#### Comment Filtering Not Working
- Check if Gemini AI API key is set in .env
- Verify database connections for new models
- Check console logs for filtering errors

### 5. API Endpoints Reference

#### Authentication
- POST /api/users/normal/signup
- POST /api/users/community/signup  
- POST /api/users/expert/signup
- POST /api/users/normal/login
- POST /api/users/community/login
- POST /api/users/expert/login

#### News
- GET /api/news/posts
- POST /api/news/upload (authenticated, normal users)
- POST /api/news/vote/{postId} (authenticated, community/expert)

#### Comments
- POST /api/news/community-comment/add (authenticated, community)
- POST /api/news/expert-comment/add (authenticated, expert)
- GET /api/news/community-comment
- GET /api/news/expert-comment

#### Comment Filtering (New)
- GET /api/comment-filter/test
- GET /api/comment-filter/grouped/{newsId}
- GET /api/comment-filter/filtered/{newsId}
- GET /api/comment-filter/summary/{newsId}
- PUT /api/comment-filter/group/{groupId}/label
- DELETE /api/comment-filter/group/{groupId}

### 6. Database Verification

Check MongoDB collections:
- normalusers, communityusers, expertusers
- news
- communitycomments, expertcomments
- commentfilters, commentgroups (new)

### 7. Production Deployment Notes

For production:
1. Update frontend config.js with actual backend URL
2. Set proper CORS origins in backend
3. Configure environment variables
4. Set up proper database connection
5. Enable HTTPS
6. Configure file upload storage (AWS S3, etc.)

## Integration Status: ✅ COMPLETE

All major features integrated and tested:
- ✅ User authentication (all types)
- ✅ News submission and viewing
- ✅ Voting system
- ✅ Comment system
- ✅ Comment filtering with AI
- ✅ Protected routes
- ✅ CORS configuration
- ✅ Error handling
- ✅ File uploads
