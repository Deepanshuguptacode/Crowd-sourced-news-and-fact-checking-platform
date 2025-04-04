import React from 'react';
import { useNavigate } from 'react-router-dom';

const RightBar = () => {
  const navigate = useNavigate();

  const handlePostClick = () => {
    navigate('/submit-news');
  };

  return (
    <div className="w-full">
      <button className="px-4 py-3 rounded w-full mb-5">
        Home
      </button>
      <button className="px-4 py-3 rounded w-full mb-5">
        Trending
      </button>
      <button className="px-4 py-3 rounded w-full mb-5">
        Settings
      </button>
      <button className="px-4 py-3 rounded w-full mb-5">
        Help
      </button>
      <button
        className="bg-orange-500 px-4 py-3 rounded mb-1 text-white w-full hover:bg-orange-600"
        onClick={handlePostClick}
      >
        Post
      </button>
    </div>
  );
};

export default RightBar;
