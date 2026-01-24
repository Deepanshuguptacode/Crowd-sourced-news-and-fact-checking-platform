# 10 - News Components: NewsFeed, NewsCard, and Content Display

## What You'll Learn
- How the news feed fetches and displays articles
- NewsCard component structure and features
- Voting functionality
- Image handling and galleries
- AI review display
- Comment integration
- Props and data flow between components

---

## News Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NEWS COMPONENT ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

HomePage
    │
    ├── Header
    │
    └── Main Content
        │
        └── NewsFeed Component
            │
            ├── Fetches all news from API
            │
            └── Maps over news array
                │
                ├── NewsCard #1 ────────┐
                ├── NewsCard #2         │
                ├── NewsCard #3         │   Each NewsCard:
                └── NewsCard #N         │   - Title & content
                                        │   - Images
                                        │   - Voting buttons
                                        │   - Comments section
                                        │   - AI analysis
                                        └──────────────────
```

---

## NewsFeed Component

NewsFeed is the container that fetches all news and renders individual cards.

```jsx
// frontend/src/components/NewsFeed.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import NewsCard from './NewsCard';
import { newsAPI } from '../services/api';
import config from '../config';

const NewsFeed = () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // News data from API
  const [news, setNews] = useState([]);
  
  // Loading state for spinner
  const [loading, setLoading] = useState(true);
  
  // Error message if fetch fails
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH NEWS ON MOUNT
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        
        // Call API to get all news posts
        const response = await newsAPI.getAllPosts();
        
        // Extract news array from response
        setNews(response.news || []);
        
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err.message || 'Failed to load news');
        toast.error('Failed to load news feed');
        
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);  // Empty dependency array = runs once on mount
```

### Vote Handler

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // VOTE HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Called when user votes on a news item
  const handleVote = (postId, voteType, newVoteCount) => {
    // Update local state to reflect vote
    setNews(prevNews =>
      prevNews.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            // Update upvotes or downvotes based on voteType
            upvotes: voteType === 'upvote' 
              ? [...(post.upvotes || []), 'newVote']  // Add vote
              : post.upvotes,
            downvotes: voteType === 'downvote' 
              ? [...(post.downvotes || []), 'newVote'] 
              : post.downvotes,
          };
        }
        return post;
      })
    );
  };
```

### Comment Added Handler

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // COMMENT ADDED HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Called when a new comment is added to a news item
  const handleCommentAdded = (postId, newComment, userType) => {
    setNews(prevNews =>
      prevNews.map(post => {
        if (post._id === postId) {
          const updatedPost = { ...post };
          
          // Ensure comments object exists
          const existingComments = updatedPost.comments || { community: [], expert: [] };
          
          // Create new comment object
          const newCommentObj = {
            _id: newComment._id || Date.now(),  // Use returned ID or temp
            comment: newComment.comment,
            stance: newComment.stance,
            commenter: newComment.commenter,
            createdAt: newComment.createdAt || new Date().toISOString(),
          };
          
          // Add to appropriate array based on user type
          if (userType === 'community') {
            existingComments.community = [newCommentObj, ...existingComments.community];
          } else if (userType === 'expert') {
            existingComments.expert = [newCommentObj, ...existingComments.expert];
          }
          
          updatedPost.comments = existingComments;
          return updatedPost;
        }
        return post;
      })
    );
  };
```

### Rendering News Cards

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 
                        border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {news.length === 0 ? (
        // Empty state
        <div className="text-center text-gray-400 py-8">
          <p>No news articles available at the moment.</p>
        </div>
      ) : (
        // Map over news and render cards
        news.map((item, index) => {
          // ─────────────────────────────────────────────────────────────
          // PROCESS COMMENTS
          // ─────────────────────────────────────────────────────────────
          
          // Combine community and expert comments into unified format
          const allComments = [
            ...((item.comments?.community || []).map(c => ({
              text: c.comment,
              type: 'community',
              username: c.commenter?.username || 'Anonymous',
              _id: c._id,
              stance: c.stance,
              evidenceLinks: c.evidenceLinks || [],
              expertVotes: c.expertVotes || [],
              createdAt: c.createdAt
            }))),
            ...((item.comments?.expert || []).map(c => ({
              text: c.comment,
              type: 'expert',
              username: c.expert?.username || 'Expert',
              _id: c._id,
              stance: c.stance,
              evidenceLinks: c.evidenceLinks || [],
              expertVotes: c.expertVotes || [],
              createdAt: c.createdAt
            })))
          ];

          // ─────────────────────────────────────────────────────────────
          // PROCESS IMAGE URLS
          // ─────────────────────────────────────────────────────────────
          
          const processedImageUrls = (item.screenshots || []).map(screenshot => {
            // If already full URL, use as-is
            if (screenshot.startsWith('http://') || screenshot.startsWith('https://')) {
              return screenshot;
            }
            // Otherwise, prepend base URL
            return `${config.BASE_URL}${screenshot}`;
          });
          
          // ─────────────────────────────────────────────────────────────
          // RENDER NEWS CARD
          // ─────────────────────────────────────────────────────────────
          
          return (
            <div key={item._id} className={index === 0 ? 'pt-0' : 'pt-0'}>
              <NewsCard
                postId={item._id}
                title={item.title}
                content={item.description}
                factStatus={item.status}
                link={item.link}
                upvotes={typeof item.upvotes === 'number' 
                  ? item.upvotes 
                  : (item.upvotes?.length || 0)}
                downvotes={typeof item.downvotes === 'number' 
                  ? item.downvotes 
                  : (item.downvotes?.length || 0)}
                comments={allComments}
                imageUrl={processedImageUrls}
                username={item.uploadedBy?.username || 'Anonymous'}
                aiReview={item.aiReview}
                confidence={item.confidence}
                onVote={handleVote}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          );
        })
      )}
    </div>
  );
};

export default NewsFeed;
```

---

## NewsCard Component

The NewsCard displays a single news article with all its features.

```jsx
// frontend/src/components/NewsCard.jsx

import { useState, useContext } from 'react';
import { toast } from 'react-toastify';
import { UserContext } from '../context/userContext';
import { newsAPI } from '../services/api';
import CommentSection from './CommentSection';
import AIVerdictSection from './AIVerdictSection';

const NewsCard = ({
  // ═══════════════════════════════════════════════════════════════════════════
  // PROPS
  // ═══════════════════════════════════════════════════════════════════════════
  
  postId,          // Unique identifier for the news post
  title,           // Headline of the news
  content,         // Full text content/description
  factStatus,      // "Verified", "Pending", or "Fake"
  link,            // External source link
  upvotes,         // Number of upvotes
  downvotes,       // Number of downvotes
  comments,        // Array of comment objects
  imageUrl,        // Array of image URLs
  username,        // Uploader's username
  aiReview,        // AI verdict: "REAL", "FAKE", "PENDING"
  confidence,      // AI confidence score (0-1)
  onVote,          // Callback when voting
  onCommentAdded,  // Callback when comment is added
}) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [showComments, setShowComments] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  
  // Image pagination
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 2;
  
  // Get user context
  const { userType, isAuthenticated } = useContext(UserContext);
```

### Voting Handler

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // VOTE HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleVote = async (voteType) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }
    
    // Guests can't vote
    if (userType === 'guest') {
      toast.warning('Guests cannot vote. Please create an account.');
      return;
    }
    
    // Prevent double-clicking
    if (isVoting) return;
    setIsVoting(true);

    try {
      // Call API to record vote
      const response = await newsAPI.voteNews(postId, voteType);
      
      // Notify parent component
      onVote?.(postId, voteType, response.newCount);
      
      toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully!`);
      
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info('You have already voted on this post');
      } else {
        toast.error('Failed to vote');
      }
    } finally {
      setIsVoting(false);
    }
  };
```

### Image Pagination

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE PAGINATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Calculate which images to show
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = imageUrl.slice(indexOfFirstImage, indexOfLastImage);
  
  const nextPage = () => {
    if (indexOfLastImage < imageUrl.length) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
```

### NewsCard JSX Structure

```jsx
  // Text truncation
  const maxTextLength = 300;
  const isLongText = content.length > maxTextLength;

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg 
                        border border-gray-200 dark:border-gray-700 
                        overflow-hidden transition-all duration-200 
                        hover:shadow-xl">
      
      {/* ─────────────────────────────────────────────────────────────────
          HEADER: Title, Source Link, Status Badge
      ───────────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 
                           dark:text-white line-clamp-2 leading-tight">
              {title}
            </h2>
            
            {/* Source link */}
            {link && (
              <a 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center mt-2 text-sm text-blue-600 
                           dark:text-blue-400 hover:underline"
              >
                <span>View Source</span>
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" 
                     viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" 
                        strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
          
          {/* Fact Status Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                           flex items-center ml-4 ${
            factStatus === "Verified" 
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : factStatus === "Pending" 
              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              factStatus === "Verified" ? "bg-green-500" 
              : factStatus === "Pending" ? "bg-yellow-500" 
              : "bg-red-500"
            }`}></span>
            {factStatus}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          CONTENT: Text + Images
      ───────────────────────────────────────────────────────────────── */}
      <div className="pb-4">
        {/* Text Content */}
        <div className="w-full p-4">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
            {showFullText ? content : content.slice(0, maxTextLength)}
            {isLongText && !showFullText && '...'}
          </p>
          
          {/* Read More/Less Button */}
          {isLongText && (
            <button 
              onClick={() => setShowFullText(!showFullText)}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium 
                         mt-3 flex items-center"
            >
              <span>{showFullText ? 'Show less' : 'Read more'}</span>
              <svg className={`w-4 h-4 ml-1 transition-transform ${
                showFullText ? 'rotate-180' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
        
        {/* ─────────────────────────────────────────────────────────────────
            IMAGES GALLERY
        ───────────────────────────────────────────────────────────────── */}
        <div className="w-full px-4 sm:px-10">
          {currentImages.length > 0 ? (
            <div className="relative">
              <div className={`grid gap-3 ${
                currentImages.length === 1 ? 'grid-cols-1' 
                : 'grid-cols-1 sm:grid-cols-2'
              }`}>
                {currentImages.map((url, index) => (
                  <div key={index} 
                       className="relative group bg-gray-100 dark:bg-gray-800 
                                  rounded-lg overflow-hidden">
                    <img 
                      src={url} 
                      alt={`News image ${index + 1}`} 
                      className="w-full h-auto object-contain"
                      onError={(e) => {
                        // Hide broken image, show fallback
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback for broken images */}
                    <div className="hidden absolute inset-0 items-center 
                                    justify-center text-gray-400">
                      <p className="text-xs">Image unavailable</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {imageUrl.length > imagesPerPage && (
                <div className="flex justify-center space-x-2 mt-4">
                  <button onClick={prevPage} disabled={currentPage === 1} 
                          className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 
                                     rounded-lg disabled:opacity-50">←</button>
                  <span className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 
                                   text-blue-700 dark:text-blue-400 rounded-lg">
                    {currentPage} / {Math.ceil(imageUrl.length / imagesPerPage)}
                  </span>
                  <button onClick={nextPage} 
                          disabled={indexOfLastImage >= imageUrl.length}
                          className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 
                                     rounded-lg disabled:opacity-50">→</button>
                </div>
              )}
            </div>
          ) : (
            /* No images placeholder */
            <div className="w-full flex items-center justify-center 
                            bg-gray-100 dark:bg-gray-800 text-gray-400 
                            rounded-lg py-16">
              <p className="text-sm">No images available</p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          AI ANALYSIS SECTION (Collapsible)
      ───────────────────────────────────────────────────────────────── */}
      {aiReview && aiReview !== "PENDING" && (
        <div className="px-6 pb-4">
          <button 
            onClick={() => setShowAiAnalysis(!showAiAnalysis)}
            className="w-full flex items-center justify-between p-4 
                       bg-gradient-to-r from-purple-50 to-blue-50 
                       dark:from-purple-900/20 dark:to-blue-900/20 
                       rounded-xl border border-purple-200/50 
                       dark:border-purple-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 
                              rounded-lg flex items-center justify-center">
                {/* AI Icon */}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  AI Analysis
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Machine learning verification
                </p>
              </div>
            </div>
            {/* Expand/Collapse Icon */}
          </button>
          
          {showAiAnalysis && (
            <AIVerdictSection 
              postId={postId}
              verdict={aiReview}
              confidence={confidence}
            />
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          ACTION BAR: Votes, Comments Toggle, Share
      ───────────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 
                      border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Left: Vote buttons */}
          <div className="flex items-center space-x-4">
            {/* Upvote */}
            <button 
              onClick={() => handleVote('upvote')}
              disabled={isVoting}
              className="flex items-center space-x-1 text-gray-600 
                         dark:text-gray-400 hover:text-green-600 
                         dark:hover:text-green-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" 
                   viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-sm font-medium">{upvotes}</span>
            </button>
            
            {/* Downvote */}
            <button 
              onClick={() => handleVote('downvote')}
              disabled={isVoting}
              className="flex items-center space-x-1 text-gray-600 
                         dark:text-gray-400 hover:text-red-600 
                         dark:hover:text-red-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" 
                   viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="text-sm font-medium">{downvotes}</span>
            </button>
          </div>
          
          {/* Center: Comment toggle */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-600 
                       dark:text-gray-400 hover:text-blue-600 
                       dark:hover:text-blue-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" 
                 viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium">
              {comments.length} Comments
            </span>
          </button>
          
          {/* Right: Uploader info */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Posted by <span className="font-medium">{username}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          COMMENTS SECTION (Collapsible)
      ───────────────────────────────────────────────────────────────── */}
      {showComments && (
        <CommentSection 
          newsId={postId}
          initialComments={comments}
          onCommentAdded={(comment) => onCommentAdded?.(postId, comment, userType)}
        />
      )}
    </article>
  );
};

export default NewsCard;
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW: NEWS FEED                                     │
└─────────────────────────────────────────────────────────────────────────────┘

1. INITIAL LOAD
┌──────────────────────────────────────────────────────────────────────────┐
│  NewsFeed useEffect                                                       │
│       │                                                                   │
│       ▼                                                                   │
│  newsAPI.getAllPosts()                                                    │
│       │                                                                   │
│       ▼                                                                   │
│  setNews(response.news)                                                   │
│       │                                                                   │
│       ▼                                                                   │
│  news.map() → Render NewsCard for each                                   │
└──────────────────────────────────────────────────────────────────────────┘

2. VOTING
┌──────────────────────────────────────────────────────────────────────────┐
│  User clicks upvote button in NewsCard                                   │
│       │                                                                   │
│       ▼                                                                   │
│  NewsCard.handleVote('upvote')                                           │
│       │                                                                   │
│       ▼                                                                   │
│  newsAPI.voteNews(postId, 'upvote')                                      │
│       │                                                                   │
│       ▼                                                                   │
│  onVote(postId, 'upvote', newCount)  ← Callback to parent                │
│       │                                                                   │
│       ▼                                                                   │
│  NewsFeed.handleVote() updates local state                               │
│       │                                                                   │
│       ▼                                                                   │
│  UI re-renders with new vote count                                       │
└──────────────────────────────────────────────────────────────────────────┘

3. ADDING COMMENT
┌──────────────────────────────────────────────────────────────────────────┐
│  User types comment in CommentSection                                    │
│       │                                                                   │
│       ▼                                                                   │
│  CommentSection submits to API                                           │
│       │                                                                   │
│       ▼                                                                   │
│  onCommentAdded(comment)  ← Callback to NewsCard                         │
│       │                                                                   │
│       ▼                                                                   │
│  NewsCard calls parent: onCommentAdded(postId, comment, userType)       │
│       │                                                                   │
│       ▼                                                                   │
│  NewsFeed.handleCommentAdded() updates local state                       │
│       │                                                                   │
│       ▼                                                                   │
│  UI re-renders with new comment                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Props Reference

### NewsCard Props

| Prop | Type | Description |
|------|------|-------------|
| `postId` | string | Unique identifier |
| `title` | string | News headline |
| `content` | string | Full description |
| `factStatus` | string | "Verified", "Pending", or "Fake" |
| `link` | string | External source URL |
| `upvotes` | number | Count of upvotes |
| `downvotes` | number | Count of downvotes |
| `comments` | array | Array of comment objects |
| `imageUrl` | array | Array of image URLs |
| `username` | string | Uploader's username |
| `aiReview` | string | "REAL", "FAKE", "PENDING" |
| `confidence` | number | AI confidence (0-1) |
| `onVote` | function | Callback for votes |
| `onCommentAdded` | function | Callback for new comments |

---

## Interview Questions & Answers

### Q1: How do you handle image loading errors?

**Answer:** Using the `onError` event handler on img elements. When an image fails to load, we hide it and show a fallback placeholder by manipulating the display styles of sibling elements.

### Q2: Why use callbacks (onVote, onCommentAdded) instead of updating locally?

**Answer:** To maintain a single source of truth. The parent component (NewsFeed) owns the news state. When a child component (NewsCard) changes data, it notifies the parent via callback, and the parent updates its state. This ensures all components stay in sync.

### Q3: How does the "Read more" feature work?

**Answer:**
1. Check if content length > maxTextLength (300 chars)
2. If so, show truncated text with "..."
3. Toggle `showFullText` state on button click
4. Conditionally render full or truncated content based on state

### Q4: Why map comments in NewsFeed before passing to NewsCard?

**Answer:** To normalize the data format. Backend returns separate `community` and `expert` arrays with different structures. We transform them into a unified format with consistent properties like `text`, `type`, `username` for easier rendering.

---

**Next: [11-COMMENT-COMPONENTS.md](./11-COMMENT-COMPONENTS.md)** - Comment sections, grouping, and interactions →
