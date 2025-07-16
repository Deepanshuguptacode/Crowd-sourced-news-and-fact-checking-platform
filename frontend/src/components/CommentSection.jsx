import { useState, useContext } from "react";
import PropTypes from "prop-types";
import { UserContext } from "../context/userContext";
import { commentsAPI, commentFilterAPI } from "../services/api";
import { toast } from "react-toastify";

const CommentSection = ({ comments, onAddComment, onClose, newsId }) => {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGroupedComments, setShowGroupedComments] = useState(false);
  const [groupedComments, setGroupedComments] = useState([]);
  const [loadingGrouped, setLoadingGrouped] = useState(false);
  const { userType, isAuthenticated } = useContext(UserContext);

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add comments");
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
        comment: newComment.trim()
      };

      let response;
      if (userType === 'community') {
        response = await commentsAPI.addCommunityComment(commentData);
      } else if (userType === 'expert') {
        response = await commentsAPI.addExpertComment(commentData);
      }

      toast.success("Comment added successfully!");
      setNewComment("");
      
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
            {loadingGrouped ? 'Loading...' : showGroupedComments ? 'Hide Grouped' : 'Show Grouped'}
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">Close</button>
        </div>
      </div>
      <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
        {!showGroupedComments ? (
          // Regular comments view
          comments.map((item, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 border border-gray-300 rounded shadow-sm"
            >
              <p className="text-sm text-gray-600 font-bold">
                {item.type === "expert" ? "Expert" : "Community"} - {item.username}
              </p>
              <p className="text-gray-800">{item.text}</p>
            </div>
          ))
        ) : (
          // Grouped comments view
          groupedComments.length > 0 ? (
            groupedComments.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-t p-2">
                  <h5 className="font-semibold text-blue-800">
                    Group {groupIndex + 1}: {group.label || 'Unlabeled'}
                  </h5>
                  <p className="text-sm text-blue-600">
                    {group.comments?.length || 0} comments | Similarity: {((group.averageSimilarity || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-b p-2 space-y-2">
                  {group.comments?.map((comment, commentIndex) => (
                    <div key={commentIndex} className="p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600 font-bold">
                        {comment.commentType === "expert" ? "Expert" : "Community"} - {comment.username || 'Anonymous'}
                      </p>
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
      <div className="mt-4 flex">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-grow border border-gray-300 rounded-l px-4 py-2 focus:outline-none"
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

