import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/userContext";
import { newsAPI } from "../services/api";
import config from "../config";
import NewsCard from "./NewsCard";
import { toast } from "react-toastify";

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, userType } = useContext(UserContext);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await newsAPI.getAllPosts();
        setNews(response.news || []);
      } catch (error) {
        setError("Failed to fetch news data. Please try again later.");
        toast.error("Failed to load news feed");
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handleVote = async (postId, voteType) => {
    if (!isAuthenticated || userType === 'guest') {
      toast.error(userType === 'guest' ? "Guests cannot vote. Please create an account." : "Please login to vote");
      return;
    }

    try {
      const response = await newsAPI.voteNews(postId, voteType);
      
      setNews(prevNews => prevNews.map(post => {
        if (post._id === postId) {
          const updatedPost = { ...post, upvotes: response.data.upvotes || 0, downvotes: response.data.downvotes || 0 };
          if (response.data.status) updatedPost.status = response.data.status;
          return updatedPost;
        }
        return post;
      }));
      
      toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`);
      if (response.data.status && response.data.status !== 'Pending') {
        toast.info(`News status updated to: ${response.data.status}`, { autoClose: 3000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to vote");
    }
  };

  const handleCommentAdded = async (postId, newComment, commentType, username) => {
    setNews(prevNews => prevNews.map(post => {
      if (post._id === postId) {
        const updatedPost = { ...post };
        const newCommentObj = { text: newComment, type: commentType, username: username };
        const existingComments = updatedPost.comments || { community: [], expert: [] };
        
        if (commentType === 'community') {
          existingComments.community = [newCommentObj, ...existingComments.community];
        } else if (commentType === 'expert') {
          existingComments.expert = [newCommentObj, ...existingComments.expert];
        }
        
        updatedPost.comments = existingComments;
        return updatedPost;
      }
      return post;
    }));
  };

  const handlePostDeleted = (postId) => {
    setNews(prevNews => prevNews.filter(post => post._id !== postId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) return <p className="text-red-500 text-center">{error}</p>;

  const processComments = (comments) => [
    ...((comments?.community || []).map(c => ({ text: c.comment, type: 'community', username: c.commenter?.username || 'Anonymous', _id: c._id, commenterId: c.commenter?._id, stance: c.stance, evidenceLinks: c.evidenceLinks || [], expertVotes: c.expertVotes || [], upvoteCount: c.upvoteCount || 0, downvoteCount: c.downvoteCount || 0, createdAt: c.createdAt }))),
    ...((comments?.expert || []).map(c => ({ text: c.comment, type: 'expert', username: c.expert?.username || 'Expert', _id: c._id, commenterId: c.expert?._id, stance: c.stance, evidenceLinks: c.evidenceLinks || [], expertVotes: c.expertVotes || [], upvoteCount: c.upvoteCount || 0, downvoteCount: c.downvoteCount || 0, createdAt: c.createdAt })))
  ];

  const processImageUrls = (screenshots) => (screenshots || []).map(screenshot => 
    (screenshot.startsWith('http://') || screenshot.startsWith('https://')) ? screenshot : `${config.BASE_URL}${screenshot}`
  );

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {news.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p>No news articles available at the moment.</p>
        </div>
      ) : (
        news.map((item) => (
          <NewsCard
            key={item._id}
            postId={item._id}
            title={item.title}
            content={item.description}
            factStatus={item.status}
            link={item.link}
            upvotes={typeof item.upvotes === 'number' ? item.upvotes : (item.upvotes?.length || 0)}
            downvotes={typeof item.downvotes === 'number' ? item.downvotes : (item.downvotes?.length || 0)}
            comments={processComments(item.comments)}
            imageUrl={processImageUrls(item.screenshots)}
            username={item.uploadedBy?.username || 'Anonymous'}
            uploadedById={item.uploadedBy?._id}
            aiReview={item.aiReview}
            confidence={item.confidence}
            onVote={handleVote}
            onCommentAdded={handleCommentAdded}
            onPostDeleted={handlePostDeleted}
          />
        ))
      )}
    </div>
  );
};

export default NewsFeed;