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
  const { isAuthenticated } = useContext(UserContext);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await newsAPI.getAllPosts(); // Use getAllPosts since reposts are now regular news
        console.log("Response Data:", response);
        setNews(response.news || []);
      } catch (error) {
        setError("Failed to fetch news data. Please try again later.");
        console.error("Fetch news error:", error);
        toast.error("Failed to load news feed");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleVote = async (postId, voteType) => {
    if (!isAuthenticated) {
      toast.error("Please login to vote");
      return;
    }

    try {
      await newsAPI.voteNews(postId, voteType);
      
      // Update local state
      setNews(prevNews => 
        prevNews.map(post => {
          if (post._id === postId) {
            const updatedPost = { ...post };
            if (voteType === 'upvote') {
              updatedPost.upvotes = [...(post.upvotes || []), 'current_user'];
              updatedPost.downvotes = (post.downvotes || []).filter(id => id !== 'current_user');
            } else {
              updatedPost.downvotes = [...(post.downvotes || []), 'current_user'];
              updatedPost.upvotes = (post.upvotes || []).filter(id => id !== 'current_user');
            }
            return updatedPost;
          }
          return post;
        })
      );
      
      toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to vote");
    }
  };

  const handleCommentAdded = async (postId, newComment, commentType, username) => {
    // Update local state to immediately show the new comment
    setNews(prevNews => 
      prevNews.map(post => {
        if (post._id === postId) {
          const updatedPost = { ...post };
          const newCommentObj = {
            text: newComment,
            type: commentType,
            username: username
          };
          
          // Add to the beginning of comments array to show newest first
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
      })
    );
  };

  console.log("NewsFeed Component Loaded!");
  console.log("News Data:", news);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  // Sample data for testing if backend returns nothing
  const sampleNews = [
    {
      _id: '1',
      title: 'AI Breakthrough in 2025',
      description: 'Researchers have developed a new AI model that surpasses human performance in language tasks.',
      status: 'Verified',
      link: 'https://example.com/ai-breakthrough',
      upvotes: [1,2,3],
      downvotes: [4],
      comments: {
        community: [
          { comment: 'Amazing progress!', commenter: { username: 'userA' } },
        ],
        expert: [
          { comment: 'Needs more peer review.', expert: { username: 'DrExpert' } },
        ]
      },
      screenshots: [],
      uploadedBy: { username: 'admin' },
      aiReview: 'REAL',
      confidence: 0.92
    },
    {
      _id: '2',
      title: 'Climate Policy Update',
      description: 'World leaders agree on new climate change policy to reduce emissions by 50% by 2030.',
      status: 'Pending',
      link: 'https://example.com/climate-policy',
      upvotes: [1,2],
      downvotes: [],
      comments: { community: [], expert: [] },
      screenshots: [],
      uploadedBy: { username: 'climateUser' },
      aiReview: 'PENDING',
      confidence: 0
    }
  ];

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {news.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p>No news articles available at the moment.</p>
        </div>
      ) : (
        news.map((item, index) => {
          // Handle all posts as regular news (including reposts which are now news posts)
          const allComments = [
            ...((item.comments?.community || []).map(c => ({
              text: c.comment,
              type: 'community',
              username: c.commenter?.username || 'Anonymous'
            }))),
            ...((item.comments?.expert || []).map(c => ({
              text: c.comment,
              type: 'expert',
              username: c.expert?.username || 'Expert'
            })))
          ];

          // Handle image URLs - check if already complete URLs or need base URL prepending
          const processedImageUrls = (item.screenshots || []).map(screenshot => {
            // If screenshot already starts with http:// or https://, use as is
            if (screenshot.startsWith('http://') || screenshot.startsWith('https://')) {
              return screenshot;
            }
            // Otherwise, prepend base URL for local uploads
            return `${config.BASE_URL}${screenshot}`;
          });
          
          return (
            <div key={item._id} className={index === 0 ? 'pt-0' : 'pt-0'}>
              <NewsCard
                postId={item._id}
                title={item.title}
                content={item.description}
                factStatus={item.status}
                link={item.link}
                upvotes={item.upvotes?.length || 0}
                downvotes={item.downvotes?.length || 0}
                comments={allComments}
                imageUrl={processedImageUrls}
                username={item.uploadedBy?.username || 'Anonymous'}
                aiReview={item.aiReview}
                confidence={item.confidence}
                onVote={handleVote}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          );
        })
      )}
    </div>
  );
};

export default NewsFeed;