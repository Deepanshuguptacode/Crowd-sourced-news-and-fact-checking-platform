import { useState, useContext } from "react";
import PropTypes from "prop-types";
import { UserContext } from "../context/userContext";

const CommentSection = ({ comments, onAddComment, onClose }) => {
  const [newComment, setNewComment] = useState("");
  const { userType } = useContext(UserContext);

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment, userType);
      setNewComment("");
    }
  };

  return (
    <div className="mt-4 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center border-b pb-2">
        <h4 className="text-lg font-semibold">Comments</h4>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800">Close</button>
      </div>
      <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
        {comments.map((item, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 border border-gray-300 rounded shadow-sm"
          >
            <p className="text-sm text-gray-600 font-bold">
              {item.type === "expert" ? "Expert" : "Community"} - {item.username}
            </p>
            <p className="text-gray-800">{item.text}</p>
          </div>
        ))}
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
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
        >
          Post
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
};

export default CommentSection;

