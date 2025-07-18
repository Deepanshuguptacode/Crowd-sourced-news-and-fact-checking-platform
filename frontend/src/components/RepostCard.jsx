import React from 'react';
import { ExternalLink, Share2, Clock, User } from 'lucide-react';

const RepostCard = ({ repost, onVote }) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-4">
      {/* Repost Header */}
      <div className="flex items-center space-x-2 mb-4">
        <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
          {repost.repostedBy?.username || repost.repostedBy?.name || 'User'} reposted
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{formatDate(repost.timestamp)}</span>
        </div>
      </div>

      {/* User Comment (if any) */}
      {repost.repostComment && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-800 dark:text-gray-200 text-sm italic">
            "{repost.repostComment}"
          </p>
        </div>
      )}

      {/* Original News Content */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
        {/* News Image */}
        {repost.originalNews.image && (
          <div className="mb-3">
            <img
              src={repost.originalNews.image}
              alt={repost.originalNews.title}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* News Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {repost.originalNews.source} • {repost.originalNews.category}
          </span>
        </div>

        {/* News Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {repost.originalNews.title}
        </h3>

        {/* News Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
          {repost.originalNews.description}
        </p>

        {/* Read Original Link */}
        <a
          href={repost.originalNews.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Read Original Article</span>
        </a>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-4">
          {/* Upvote Button */}
          <button
            onClick={() => onVote && onVote(repost._id, 'upvote')}
            className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-sm">{repost.upvotes?.length || 0}</span>
          </button>

          {/* Downvote Button */}
          <button
            onClick={() => onVote && onVote(repost._id, 'downvote')}
            className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-sm">{repost.downvotes?.length || 0}</span>
          </button>

          {/* Comments Count */}
          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">
              {(repost.comments?.community?.length || 0) + (repost.comments?.expert?.length || 0)}
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          Repost
        </div>
      </div>
    </div>
  );
};

export default RepostCard;
