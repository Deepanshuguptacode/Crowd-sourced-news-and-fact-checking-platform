import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { UserContext } from '../context/userContext';
import { commentsAPI } from '../services/api';
import { toast } from 'react-toastify';

const ExpertVotingSection = ({ 
  commentId, 
  commentType, 
  upvoteCount = 0, 
  downvoteCount = 0, 
  expertVotes = [],
  onVoteUpdate 
}) => {
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteType, setVoteType] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showVotes, setShowVotes] = useState(false);

  const { userType, isAuthenticated } = useContext(UserContext);
  const isExpert = userType === 'expert';

  const handleVoteSubmit = async () => {
    if (!explanation.trim()) {
      toast.error('Please provide an explanation for your vote');
      return;
    }

    setSubmitting(true);
    try {
      const voteData = { voteType, explanation: explanation.trim() };
      
      let response;
      if (commentType === 'community') {
        response = await commentsAPI.expertVoteOnCommunityComment(commentId, voteData);
      } else {
        response = await commentsAPI.expertVoteOnExpertComment(commentId, voteData);
      }

      toast.success('Vote submitted successfully!');
      setShowVoteModal(false);
      setExplanation('');
      setVoteType('');

      // Update parent component with new vote counts
      if (onVoteUpdate) {
        onVoteUpdate(response.upvoteCount, response.downvoteCount);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const openVoteModal = (type) => {
    setVoteType(type);
    setShowVoteModal(true);
  };

  // Find current user's existing vote
  const userString = localStorage.getItem('user');
  const userData = userString ? JSON.parse(userString) : null;
  const currentUserId = userData?.id;
  const userVote = expertVotes.find(vote => vote.expert._id === currentUserId);

  return (
    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
      {/* Vote counts and buttons */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowVotes(!showVotes)}
              className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
            >
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{upvoteCount}</span>
            </button>
            <button
              onClick={() => setShowVotes(!showVotes)}
              className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{downvoteCount}</span>
            </button>
          </div>
        </div>

        {/* Expert voting buttons */}
        {isAuthenticated && isExpert && (
          <div className="flex items-center space-x-2">
            {userVote && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                You voted: {userVote.voteType}
              </span>
            )}
            <button
              onClick={() => openVoteModal('upvote')}
              className={`px-2 py-1 text-xs rounded ${
                userVote?.voteType === 'upvote'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-green-900/30 dark:hover:text-green-300'
              }`}
            >
              👍 {userVote?.voteType === 'upvote' ? 'Update' : 'Upvote'}
            </button>
            <button
              onClick={() => openVoteModal('downvote')}
              className={`px-2 py-1 text-xs rounded ${
                userVote?.voteType === 'downvote'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-300'
              }`}
            >
              👎 {userVote?.voteType === 'downvote' ? 'Update' : 'Downvote'}
            </button>
          </div>
        )}
      </div>

      {/* Expert votes display */}
      {showVotes && expertVotes.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-2">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expert Opinions ({expertVotes.length})
          </h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {expertVotes.map((vote, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 rounded p-2 border-l-4 border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {vote.expert.username}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    vote.voteType === 'upvote' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {vote.voteType === 'upvote' ? '👍 Upvote' : '👎 Downvote'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  "{vote.explanation}"
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(vote.votedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vote modal */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {voteType === 'upvote' ? '👍 Upvote' : '👎 Downvote'} Comment
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Explanation for your {voteType} (required)
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder={`Explain why you ${voteType} this comment...`}
                  maxLength={300}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                />
                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {explanation.length}/300 characters
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowVoteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVoteSubmit}
                  disabled={submitting || !explanation.trim()}
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${
                    voteType === 'upvote'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? 'Submitting...' : `Submit ${voteType}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ExpertVotingSection.propTypes = {
  commentId: PropTypes.string.isRequired,
  commentType: PropTypes.oneOf(['community', 'expert']).isRequired,
  upvoteCount: PropTypes.number,
  downvoteCount: PropTypes.number,
  expertVotes: PropTypes.array,
  onVoteUpdate: PropTypes.func,
};

export default ExpertVotingSection;