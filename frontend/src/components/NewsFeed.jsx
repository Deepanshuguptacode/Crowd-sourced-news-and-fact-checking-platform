import React, { useState, useEffect } from "react";
import axios from "axios";
import NewsCard from "./NewsCard";

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(`/api/news/posts`);
        console.log("Response Data:", response.data);
        setNews(response.data.news);
      } catch (error) {
        setError("Failed to fetch news data. Please try again later.");
        console.error("Fetch news error:", error);
      }
    };

    fetchNews();
  }, []);

  console.log("NewsFeed Component Loaded!");
  console.log("News Data:", news);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!news.length) {
    return <p>Loading news...</p>;
  }

  return (
    <div className="w-full max-w-full mx-auto p-4">
      {news.map((item) => {
        const allComments = [
          ...((item.comments.community || []).map(c => ({
            text: c.comment,
            type: 'community',
            username: c.commenter.username
          }))),
          ...((item.comments.expert || []).map(c => ({
            text: c.comment,
            type: 'expert',
            username: c.expert.username
          })))
        ];
        return (
          <NewsCard
            key={item._id}
            postId={item._id}
            title={item.title}
            content={item.description}
            factStatus={item.status}
            link={item.link}
            upvotes={item.upvotes.length}
            downvotes={item.downvotes.length}
            comments={allComments}
            imageUrl={item.screenshots.map(screenshot => `${screenshot}`)}
            // imageUrl={item.screenshots.map(screenshot => `/api${screenshot}`)}
            username={item.uploadedBy.username}
            aiReview={item.aiReview}
            confidence={item.confidence}
          />
        );
      })}
    </div>
  );
};

export default NewsFeed;