import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import CommentSection from "./CommentSection";
import axios from "axios";
import { toast } from "react-toastify";

const NewsCard = ({
  postId,
  title,
  content,
  factStatus,
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  comments: initialComments,
  imageUrl,
  username,
  link,
  aiReview,
  confidence,
  onVote,
  onCommentAdded,
}) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes || 0);
  const [downvotes, setDownvotes] = useState(initialDownvotes || 0);
  const [comments, setComments] = useState(initialComments || []);
  const [showComments, setShowComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 4;
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const maxTextLength = 220;
  const isLongText = content.length > maxTextLength;
  const displayText = showFullText ? content : content.slice(0, maxTextLength);

  // Sync comments state with prop changes
  useEffect(() => {
    setComments(initialComments || []);
  }, [initialComments]);

  const handleAddComment = async (commentData) => {
    try {
      // Check if this is the new format with comment object
      if (typeof commentData === 'object' && commentData.text) {
        // New format - comment was already added successfully in CommentSection
        const { text: newComment, type: userType, username } = commentData;
        
        if (userType.toLowerCase() === "normal") {
          toast.error("You must become a community/expert user in order to comment");
          return;
        }

        // Use the callback to update parent state if available
        if (onCommentAdded) {
          onCommentAdded(postId, newComment, userType.toLowerCase(), username);
        } else {
          // Fallback to local state update
          const type = userType.toLowerCase();
          setComments([...comments, { text: newComment, type, username }]);
        }
        return;
      }

      // Legacy format - for backward compatibility
      const newComment = commentData;
      const userType = arguments[1];
      
      if (userType.toLowerCase() === "normal") {
        toast.error("You must become a community/expert user in order to comment");
        return;
      }
      let endpoint = `/api/news/community-comment/add`; // Default endpoint for community users
      if (userType.toLowerCase() === "expert") {
        endpoint = `/api/news/expert-comment/add`;
      }

      const response = await axios.post(endpoint, { newsId: postId, comment: newComment });
      if (response.status === 201) {
        toast.success(response?.data?.message || "Comment added successfully!");
        
        // Use the callback to update parent state if available
        if (onCommentAdded) {
          const userString = localStorage.getItem('user');
          const userData = userString ? JSON.parse(userString) : null;
          const currentUsername = userData?.username || 'Anonymous';
          onCommentAdded(postId, newComment, userType.toLowerCase(), currentUsername);
        } else {
          // Fallback to local state update
          const type = userType.toLowerCase();
          setComments([...comments, { text: newComment, type }]);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add comment");
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleVotes = async (voteType) => {
    if (onVote) {
      await onVote(postId, voteType);
    } else {
      // Fallback to direct API call if onVote not provided
      try {
        const response = await axios.post(`/api/news/vote/${postId}`, { voteType });
        if (!response.data.error) {
          toast.success(response?.data?.message || "Successfully Voted!");
          setDownvotes(response.data.downvotes);
          setUpvotes(response.data.upvotes);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || `Error voting`);
      }
    }
  };

  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = imageUrl.slice(indexOfFirstImage, indexOfLastImage);

  const nextPage = () => {
    if (indexOfLastImage < imageUrl.length)
      setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1)
      setCurrentPage(currentPage - 1);
  };

  return (
    <div className="bg-white dark:bg-gray-900 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 group p-6">
      
      {/* Title */}
      <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {title}
          </a>
        </h3>
      {/* Header */}
      <div className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Community Member</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                factStatus === "Verified"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : factStatus === "Pending"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${
                factStatus === "Verified" ? "bg-green-500" : factStatus === "Pending" ? "bg-yellow-500" : "bg-red-500"
              }`}></span>
              {factStatus}
            </span>
          </div>
        </div> 
      </div>

      {/* Content Area - 2 Column Layout */}
      <div className="pb-4">
        {/* Text Content (was right column, now row 1) */}
        <div className="w-full flex flex-col justify-between p-4">
          <div className="flex-1">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                {showFullText ? content : content.slice(0, maxTextLength)}
                {isLongText && !showFullText && '...'}
              </p>
            </div>
          </div>
          {/* Read More/Less Button */}
          {isLongText && (
            <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
              <button 
                onClick={() => setShowFullText(!showFullText)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors flex items-center space-x-1 group"
              >
                <span>{showFullText ? 'Show less' : 'Read more'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${showFullText ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {/* Images (was left column, now row 2) */}
<div className="w-full px-4 sm:px-10">
  {currentImages.length > 0 ? (
    <div className="relative">
      <div 
        className={`grid gap-3 ${
          currentImages.length === 1 ? 'grid-cols-1' : 
          currentImages.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
          'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {currentImages.map((url, index) => (
          <div 
            key={index} 
            className="relative group/image bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
          >
            {/* Dynamic image container */}
            <div className="w-full h-0 pb-[56.25%] relative"> {/* Default 16:9 aspect ratio */}
              <img 
                src={url} 
                alt={`News image ${index + 1}`} 
                className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover/image:scale-105"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
                onLoad={(e) => {
                  // Dynamically adjust container based on image aspect ratio
                  const img = e.target;
                  const aspectRatio = img.naturalWidth / img.naturalHeight;
                  img.parentElement.style.paddingBottom = `${100 / aspectRatio}%`;
                }}
              />
              {/* Fallback placeholder for broken images */}
              <div 
                className="absolute inset-0 flex items-center justify-center text-gray-400"
                style={{ display: 'none' }}
              >
                <div className="text-center p-4">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs">Image unavailable</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300 pointer-events-none"></div>
          </div>
        ))}
      </div>
      
      {/* Image Pagination (unchanged) */}
      {imageUrl.length > imagesPerPage && (
        <div className="flex justify-center space-x-2 mt-4">
          <button 
            onClick={prevPage} 
            disabled={currentPage === 1} 
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            ←
          </button>
          <span className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
            {currentPage} / {Math.ceil(imageUrl.length / imagesPerPage)}
          </span>
          <button 
            onClick={nextPage} 
            disabled={indexOfLastImage >= imageUrl.length} 
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  ) : (
    <div 
      className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg py-16"
    >
      <div className="text-center">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">No images available</p>
      </div>
    </div>
  )}
</div>

      {/* AI Analysis Section */}
      {aiReview && aiReview !== "PENDING" && (
        <div className="px-6 pb-4">
          <button 
            onClick={() => setShowAiAnalysis(!showAiAnalysis)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.5 2A7.5 7.5 0 0 0 2 9.5c0 5.74 7.5 14.5 7.5 14.5s7.5-8.76 7.5-14.5A7.5 7.5 0 0 0 9.5 2zm0 10a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Analysis</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Machine learning verification</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                aiReview === "REAL" 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              }`}>
                {aiReview === "REAL" ? "Likely Real" : "Potential Misinformation"}
              </span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${showAiAnalysis ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {showAiAnalysis && (
            <div className="mt-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Detection Result</p>
                    <p className={`text-lg font-bold ${
                      aiReview === "REAL" ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {aiReview === "REAL" ? "Likely Authentic" : "Suspicious Content"}
                    </p>
                  </div>
                  
                  {confidence > 0 && (
                    <div className="flex-1 max-w-48">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Confidence</span>
                        <span>{Math.round(confidence * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            aiReview === "REAL" ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-gradient-to-r from-orange-500 to-red-500"
                          }`}
                          style={{ width: `${confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions Bar */}
      <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Voting Buttons */}
            <div className="flex items-center space-x-2">
              <button 
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg transition-colors group/vote" 
                onClick={() => handleVotes('upvote')}
              >
                <svg className="w-4 h-4 group-hover/vote:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span className="font-medium">{upvotes}</span>
              </button>
              
              <button 
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors group/vote" 
                onClick={() => handleVotes('downvote')}
              >
                <svg className="w-4 h-4 group-hover/vote:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
                <span className="font-medium">{downvotes}</span>
              </button>
            </div>
          </div>

          {/* Comments */}
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors" 
            onClick={toggleComments}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium">{comments.length} Comments</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200/50 dark:border-gray-700/50">
          <CommentSection 
            comments={comments} 
            onAddComment={handleAddComment} 
            onClose={toggleComments} 
            newsId={postId}
          />
        </div>
      )}
    </div>
    </div>
  );
};

NewsCard.propTypes = {
  postId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  factStatus: PropTypes.string.isRequired,
  upvotes: PropTypes.number,
  downvotes: PropTypes.number,
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
    })
  ),
  imageUrl: PropTypes.arrayOf(PropTypes.string),
  link: PropTypes.string.isRequired,
  aiReview: PropTypes.string,
  confidence: PropTypes.number,
  username: PropTypes.string.isRequired,
  onVote: PropTypes.func,
  onCommentAdded: PropTypes.func,
};

NewsCard.defaultProps = {
  upvotes: 0,
  downvotes: 0,
  comments: [],
  imageUrl: [],
  aiReview: "PENDING",
  confidence: 0,
};

export default NewsCard;