import React, { useState } from "react";
import PropTypes from "prop-types";

const CommentSection = ({ comments, onAddComment, onClose }) => {
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment("");
    }
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Comments</h4>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800">Close</button>
      </div>
      <div className="mt-2">
        {comments.map((comment, index) => (
          <div key={index} className="border-b border-gray-200 py-2">
            <p className="text-gray-800">{comment}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-grow border border-gray-300 rounded-l px-4 py-2"
          placeholder="Add a comment..."
        />
        <button
          onClick={handleAddComment}
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
        >
          Post
        </button>
      </div>
    </div>
  );
};

CommentSection.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddComment: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CommentSection;

