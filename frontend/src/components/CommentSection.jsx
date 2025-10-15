import { useState, useContext } from "react";
import PropTypes from "prop-types";
import { UserContext } from "../context/userContext";
import { commentsAPI, commentFilterAPI } from "../services/api";
import { toast } from "react-toastify";
import EvidenceLinksSection from "./EvidenceLinksSection";
import EvidenceDisplay from "./EvidenceDisplay";
import ExpertVotingSection from "./ExpertVotingSection";

const CommentSection = ({ comments, onAddComment, onClose, newsId }) => {
  const [newComment, setNewComment] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGroupedComments, setShowGroupedComments] = useState(false);
  const [groupedComments, setGroupedComments] = useState([]);
  const [loadingGrouped, setLoadingGrouped] = useState(false);
  const [regeneratingGroups, setRegeneratingGroups] = useState(false);
  const [showEvidenceSection, setShowEvidenceSection] = useState(false);
  const [selectedStance, setSelectedStance] = useState('general'); // New stance state
  const { userType, isAuthenticated } = useContext(UserContext);

  const handleAddComment = async () => {
    if (!isAuthenticated || userType === 'guest') {
      toast.error(userType === 'guest' ? "Guests cannot comment. Please create an account." : "Please login to add comments");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (userType !== 'community' && userType !== 'expert') {
      toast.error("Only community and expert users can add comments");
      return;
    }

    setLoading(true);
    try {
      const commentData = {
        newsId: newsId,
        comment: newComment.trim(),
        evidenceLinks: evidenceLinks.length > 0 ? evidenceLinks : undefined,
        stance: selectedStance // Include selected stance
      };

      let response;
      if (userType === 'community') {
        response = await commentsAPI.addCommunityComment(commentData);
      } else if (userType === 'expert') {
        response = await commentsAPI.addExpertComment(commentData);
      }

      toast.success("Comment added successfully!");
      setNewComment("");
      setEvidenceLinks([]);
      setShowEvidenceSection(false);
      setSelectedStance('general'); // Reset stance to default
      
      // Call parent callback if provided with the response data
      if (onAddComment) {
        const userString = localStorage.getItem('user');
        const userData = userString ? JSON.parse(userString) : null;
        const currentUsername = userData?.username || 'Anonymous';
        
        // Pass the comment data that was successfully added
        onAddComment({
          text: newComment.trim(),
          type: userType,
          username: currentUsername,
          evidenceLinks: evidenceLinks,
          response: response // Include the full response in case parent needs it
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleShowGroupedComments = async () => {
    if (showGroupedComments) {
      setShowGroupedComments(false);
      return;
    }

    setLoadingGrouped(true);
    try {
      const response = await commentFilterAPI.getGroupedComments(newsId);
      console.log('Grouped comments response:', response);
      console.log('Groups data:', response.groups);
      if (response.groups && response.groups.length > 0) {
        console.log('First group comments:', response.groups[0].comments);
      }
      setGroupedComments(response.groups || []);
      setShowGroupedComments(true);
      toast.success("Grouped comments loaded successfully!");
    } catch (error) {
      console.error('Error loading grouped comments:', error);
      toast.error(error.response?.data?.message || "Failed to load grouped comments");
    } finally {
      setLoadingGrouped(false);
    }
  };

  const handleRegenerateGroups = async () => {
    setRegeneratingGroups(true);
    try {
      const response = await commentFilterAPI.regenerateGroupNames(newsId);
      toast.success(`Updated ${response.updatedGroups?.length || 0} groups with better descriptions`);
      
      // Refresh grouped comments if they're currently shown
      if (showGroupedComments) {
        await handleShowGroupedComments();
      }
    } catch (error) {
      console.error('Error regenerating groups:', error);
      toast.error('Failed to regenerate group descriptions');
    } finally {
      setRegeneratingGroups(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center border-b pb-2">
        <h4 className="text-lg font-semibold">Comments</h4>
        <div className="flex gap-2">
          <button
            onClick={handleShowGroupedComments}
            disabled={loadingGrouped}
            className={`px-3 py-1 text-sm rounded ${
              loadingGrouped 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : showGroupedComments
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {loadingGrouped ? 'Loading...' : showGroupedComments ? 'Hide Grouped' : 'Group by Topic'}
          </button>
          {showGroupedComments && (
            <button
              onClick={handleRegenerateGroups}
              disabled={regeneratingGroups}
              className={`px-3 py-1 text-sm rounded ${
                regeneratingGroups
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {regeneratingGroups ? 'Improving...' : 'Improve Groups'}
            </button>
          )}
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">Close</button>
        </div>
      </div>
      <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
        {!showGroupedComments ? (
          // Regular comments view
          comments.map((item, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                    {item.type === "expert" ? "Expert" : "Community"} - {item.username}
                  </p>
                  {/* Stance Badge */}
                  {item.stance && (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      item.stance === 'in_favor' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : item.stance === 'against'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {item.stance === 'in_favor' ? '👍 In Favor' : 
                       item.stance === 'against' ? '👎 Against' : 
                       '💬 General'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.createdAt && new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-800 dark:text-gray-200">{item.text}</p>
              
              {/* Evidence Links Display */}
              {item.evidenceLinks && item.evidenceLinks.length > 0 && (
                <EvidenceDisplay evidenceLinks={item.evidenceLinks} />
              )}
              
              {/* Expert Voting Section */}
              {item._id && (
                <ExpertVotingSection
                  commentId={item._id}
                  commentType={item.type}
                  upvoteCount={item.upvoteCount || 0}
                  downvoteCount={item.downvoteCount || 0}
                  expertVotes={item.expertVotes || []}
                  onVoteUpdate={(upvotes, downvotes) => {
                    // Update the comment in parent state if needed
                    console.log('Vote updated:', { upvotes, downvotes });
                  }}
                />
              )}
            </div>
          ))
        ) : (
          // Grouped comments view
          groupedComments.length > 0 ? (
            groupedComments.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-t p-3">
                  <h5 className="font-semibold text-blue-800 mb-1">
                    Group {groupIndex + 1}: {group.label || 'Unlabeled'}
                  </h5>
                  {group.description && (
                    <p className="text-sm text-blue-700 mb-2 italic bg-blue-100 p-2 rounded">
                      {group.description}
                    </p>
                  )}
                  <p className="text-sm text-blue-600">
                    {group.commentCount || group.comments?.length || 0} comments • Created {new Date(group.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-b p-2 space-y-2">
                  {group.comments?.map((comment, commentIndex) => (
                    <div key={commentIndex} className="p-2 bg-gray-50 rounded border-l-4 border-blue-300">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm text-gray-600 font-bold">
                          {comment.commentType === "expert" ? "Expert" : "Community"} - {comment.username || 'Anonymous'}
                        </p>
                        {/* Stance Badge for grouped comments */}
                        {comment.stance && (
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            comment.stance === 'in_favor' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : comment.stance === 'against'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {comment.stance === 'in_favor' ? '👍' : 
                             comment.stance === 'against' ? '👎' : 
                             '💬'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800">{comment.text}</p>
                    </div>
                  )) || <p className="text-gray-500 italic">No comments in this group</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              <p>No grouped comments available</p>
            </div>
          )
        )}
      </div>
      <div className="mt-4">
        <div className="flex flex-col space-y-3">
          {/* Stance Selection */}
          {isAuthenticated && (userType === 'community' || userType === 'expert') && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your stance on this news:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="stance"
                    value="in_favor"
                    checked={selectedStance === 'in_favor'}
                    onChange={(e) => setSelectedStance(e.target.value)}
                    className="mr-2 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                    👍 In Favor
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="stance"
                    value="against"
                    checked={selectedStance === 'against'}
                    onChange={(e) => setSelectedStance(e.target.value)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-red-600 dark:text-red-400 font-medium flex items-center">
                    👎 Against
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="stance"
                    value="general"
                    checked={selectedStance === 'general'}
                    onChange={(e) => setSelectedStance(e.target.value)}
                    className="mr-2 text-gray-600 focus:ring-gray-500"
                  />
                  <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center">
                    💬 General Comment
                  </span>
                </label>
              </div>
            </div>
          )}
          
          <div className="flex">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-grow border border-gray-300 dark:border-gray-600 rounded-l px-4 py-2 focus:outline-none dark:bg-gray-700 dark:text-white"
              placeholder="Add a comment..."
            />
            <button
              onClick={handleAddComment}
              disabled={loading || !isAuthenticated}
              className={`px-4 py-2 rounded-r text-white ${
                loading || !isAuthenticated 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
          
          {/* Evidence Links Toggle */}
          {isAuthenticated && (userType === 'community' || userType === 'expert') && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowEvidenceSection(!showEvidenceSection)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                {showEvidenceSection ? 'Hide Evidence Links' : 'Add Evidence Links'}
              </button>
              
              {evidenceLinks.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {evidenceLinks.length} evidence link{evidenceLinks.length !== 1 ? 's' : ''} added
                </span>
              )}
            </div>
          )}
          
          {/* Evidence Links Section */}
          {showEvidenceSection && (
            <EvidenceLinksSection
              evidenceLinks={evidenceLinks}
              onEvidenceChange={setEvidenceLinks}
              maxLinks={3}
            />
          )}
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={handleShowGroupedComments}
          disabled={loadingGrouped}
          className={`w-full px-4 py-2 rounded text-white ${
            loadingGrouped 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {loadingGrouped ? 'Loading groups...' : (showGroupedComments ? 'Hide Grouped Comments' : 'Show Grouped Comments')}
        </button>
      </div>
    </div>
  );
};

CommentSection.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
    })
  ).isRequired,
  onAddComment: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  newsId: PropTypes.string.isRequired,
};

export default CommentSection;

