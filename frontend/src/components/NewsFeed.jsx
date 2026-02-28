import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/userContext";
import { newsAPI } from "../services/api";
import config from "../config";
import NewsCard from "./NewsCard";
import { toast } from "react-toastify";

const FeatureEducationBanner = () => {
  const [isVisible, setIsVisible] = useState(() => {
    return !localStorage.getItem('newsfeed_education_dismissed');
  });
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: '📝',
      title: 'Submit & Discover',
      description: 'Anyone can submit news for the community to verify. Browse articles below and click to explore.',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: '👍👎',
      title: 'Vote on Authenticity',
      description: 'Upvote what you believe is real, downvote what seems fake. Community consensus drives verification status.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '🤖',
      title: 'AI Analysis',
      description: 'Click "AI Analysis" on any article to see our ML model\'s verdict with confidence percentage.',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: '💡',
      title: 'Smart Comments',
      description: 'Click "Comments" → "Group by Topic" to see AI-clustered opinions. Pick your stance before commenting!',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="mb-6 relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/80 border border-gray-200/80 dark:border-gray-700/50">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${steps[activeStep].color} transition-all duration-500`}
          style={{ width: '100%', animation: 'shrink 5s linear infinite' }}
        />
      </div>
      
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Step indicators */}
            <div className="hidden sm:flex items-center gap-1.5">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-300 ${
                    i === activeStep
                      ? `bg-gradient-to-br ${step.color} text-white shadow-md scale-110`
                      : 'bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {step.icon}
                </button>
              ))}
            </div>
            
            {/* Content */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="sm:hidden text-lg">{steps[activeStep].icon}</span>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {steps[activeStep].title}
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                  How it works
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {steps[activeStep].description}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              localStorage.setItem('newsfeed_education_dismissed', 'true');
            }}
            className="flex-shrink-0 ml-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); transform-origin: left; }
          to { transform: scaleX(0); transform-origin: left; }
        }
      `}</style>
    </div>
  );
};

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
    <div data-tour="home-news-feed">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {news.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No news articles yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
            Be the first to submit a news article for the community to verify! Our multi-tier verification system will put it through crowd review, expert analysis, and AI verdict.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">
              <span>📝</span> Submit News
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium">
              <span>🗳️</span> Vote on Articles
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-medium">
              <span>🤖</span> AI Verification
            </div>
          </div>
        </div>
      ) : (
        news.map((item, index) => (
          <div key={item._id} data-tour={index === 0 ? "home-first-news-card" : undefined}>
          <NewsCard
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
            isFirst={index === 0}
          />
          </div>
        ))
      )}
      </div>
    </div>
  );
};

export default NewsFeed;