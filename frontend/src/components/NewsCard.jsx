import { useState } from "react";
import PropTypes from "prop-types";
import CommentSection from "./CommentSection";
import axios from "axios";
import { toast } from "react-toastify";

const NewsCard = ({ postId, title, content, factStatus, upvotes: initialUpvotes, downvotes: initialDownvotes, comments: initialComments, imageUrl, username, link }) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes || 0);
  const [downvotes, setDownvotes] = useState(initialDownvotes || 0);
  const [comments, setComments] = useState(initialComments || []);
  const [showComments, setShowComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 4;

  const handleAddComment = async (newComment, userType) => {
    try {
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
        // Append new comment along with its type
        const type = userType.toLowerCase();
        setComments([...comments, { text: newComment, type }]);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add comment");
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleVotes = async (voteType) => {
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
    <div className="bg-white p-4 mb-4 rounded-lg shadow-md w-full max-w-lg mx-auto">
      <p className="text-gray-800 text-xl font-bold mb-2">Posted by {username}</p>
      <h3 className="text-lg font-semibold">
        <a href={link} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      </h3>
      <p className="text-gray-600">{content}</p>
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {currentImages.map((url, index) => (
            <img key={index} src={url} alt={`Post ${index}`} className="w-full h-auto rounded-lg" />
          ))}
        </div>
      )}
      {imageUrl.length > imagesPerPage && (
        <div className="flex justify-between mt-2">
          <button onClick={prevPage} disabled={currentPage === 1} className="px-2 py-1 bg-gray-300 rounded">
            Previous
          </button>
          <button onClick={nextPage} disabled={indexOfLastImage >= imageUrl.length} className="px-2 py-1 bg-gray-300 rounded">
            Next
          </button>
        </div>
      )}
      <span
        className={`inline-block mt-2 px-2 py-1 text-sm font-bold rounded ${
          factStatus === "Verified"
            ? "bg-green-100 text-green-700"
            : factStatus === "Needs Review"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {factStatus}
      </span>
      <div className="mt-3 flex items-center space-x-4">
        <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => handleVotes('upvote')}>
          👍 {upvotes}
        </button>
        <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={() => handleVotes('downvote')}>
          👎 {downvotes}
        </button>
        <p className="text-gray-600 cursor-pointer" onClick={toggleComments}>
          💬 {comments.length} Comments
        </p>
      </div>
      {showComments && (
        <CommentSection comments={comments} onAddComment={handleAddComment} onClose={toggleComments} />
      )}
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
    })
  ),
  imageUrl: PropTypes.arrayOf(PropTypes.string),
  username: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
};

NewsCard.defaultProps = {
  upvotes: 0,
  downvotes: 0,
  comments: [],
  imageUrl: [],
};

export default NewsCard;