import React, { useState } from 'react';
import PropTypes from "prop-types";

const CommentSection = ({ comments, onAddComment }) => {
  const [newComment, setNewComment] = useState("");
  const [commentList, setCommentList] = useState(comments);

  const handleAddComment = () => {
    if (newComment.trim()) {
      setCommentList([...commentList, newComment]);
      onAddComment(newComment); // Call the prop function to update the comments in NewsCard
      setNewComment("");
    }
  };

  return (
    <div>
      <h4 className="text-lg font-semibold">Comments</h4>
      <ul className="list-disc pl-5 mt-2">
        {commentList.map((comment, index) => (
          <li key={index} className="text-gray-600 mb-1">
            {comment}
          </li>
        ))}
      </ul>
      <input
        type="text"
        className="mt-2 p-2 border rounded w-full"
        placeholder="Add a comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <button
        className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={handleAddComment}
      >
        Add Comment
      </button>
    </div>
  );
};

CommentSection.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.string),
  onAddComment: PropTypes.func.isRequired,
};

CommentSection.defaultProps = {
  comments: [],
};

export default CommentSection;

