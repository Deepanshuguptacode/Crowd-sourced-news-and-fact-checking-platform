import React, { useState } from 'react';
import { ExternalLink, Share2, Heart, MessageCircle, Clock, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { trendingNewsService } from '../services/trendingNewsService';

const TrendingNewsCard = ({ news, onRepost, currentUser, showRepostButton = true }) => {
  const [isReposting, setIsReposting] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostComment, setRepostComment] = useState('');
  const [isReposted, setIsReposted] = useState(
    news.reposts?.some(repost => repost.userId === currentUser?._id) || false
  );

  const handleRepost = async () => {
    if (!currentUser) {
      toast.error('Please login to repost news');
      return;
    }

    setIsReposting(true);
    try {
      const response = await trendingNewsService.repostNews(news._id, repostComment);
      setIsReposted(true);
      setShowRepostModal(false);
      setRepostComment('');
      
      // Show success message indicating it was posted as a new news post
      toast.success('News posted successfully as a new post!');
      
      if (onRepost) onRepost();
    } catch (error) {
      console.error('Error reposting news:', error);
      toast.error(error.message || 'Failed to repost news');
    } finally {
      setIsReposting(false);
    }
  };

  const handleRemoveRepost = async () => {
    setIsReposting(true);
    try {
      await trendingNewsService.removeRepost(news._id);
      setIsReposted(false);
      toast.success('Repost removed successfully!');
      if (onRepost) onRepost();
    } catch (error) {
      console.error('Error removing repost:', error);
      toast.error(error.message || 'Failed to remove repost');
    } finally {
      setIsReposting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* News Image */}
        {news.image && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={news.image}
              alt={news.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-4">
          {/* News Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatDate(news.fetchedAt)}</span>
              <span>•</span>
              <span className="text-blue-600 dark:text-blue-400">{news.source}</span>
            </div>
          </div>

          {/* News Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
            {news.title}
          </h3>

          {/* News Description */}
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
            {news.description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Read Full Article */}
              <a
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Read Full</span>
              </a>

              {/* Repost Count */}
              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-sm">
                <Share2 className="w-4 h-4" />
                <span>{news.repostCount || 0}</span>
              </div>
            </div>

            {/* Repost Button */}
            {showRepostButton && (
              <div className="flex items-center space-x-2">
                {isReposted ? (
                  <button
                    onClick={handleRemoveRepost}
                    disabled={isReposting}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Unrepost</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowRepostModal(true)}
                    disabled={isReposting}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Repost</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Post News to Your Feed
              </h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                  {news.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  {news.description.substring(0, 150)}...
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add your comment (optional)
                </label>
                <textarea
                  value={repostComment}
                  onChange={(e) => setRepostComment(e.target.value)}
                  placeholder="Share your thoughts about this news... This will be added to your post."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows="3"
                  maxLength="500"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {repostComment.length}/500 characters
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowRepostModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRepost}
                  disabled={isReposting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isReposting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isReposting ? 'Posting...' : 'Post News'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrendingNewsCard;
