import React, { useState } from "react";
import NewsCard from "../components/NewsCard";  



const sampleNews = [
  {
    id: 1,
    title: "Breaking News: AI Surpasses Human Intelligence",
    content: "Scientists have unveiled an AI model that outperforms humans...",
    upvotes: 150,
    downvotes: 20,
    comments: 10,
    factStatus: "Needs Review",
  },
  {
    id: 2,
    title: "Global Warming: A Call for Action",
    content: "New studies show alarming trends in global temperature rise...",
    upvotes: 200,
    downvotes: 50,
    comments: 30,
    factStatus: "Verified",
  },
];

const NewsFeed = () => {
  const [news, setNews] = useState(sampleNews);

  console.log("NewsFeed Component Loaded!");
  console.log("News Data:", news); // Debugging to ensure news is defined

  // Handle error if news is undefined
  if (!news || !Array.isArray(news)) {
    return <p className="text-red-500">Error: News data is unavailable</p>;
  }

  return (
    <div className="w-full max-w-full mx-auto p-4">
      {news.map((item) => (
        <NewsCard key={item.id} news={item} />
      ))}
    </div>
  );
};

export default NewsFeed;

