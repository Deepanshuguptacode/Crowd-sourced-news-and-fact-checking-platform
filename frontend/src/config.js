const config = {
    // Use environment variable for backend URL in production
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 
              (import.meta.env.DEV ? "/api" : "https://crowd-sourced-news-and-fact-checking.onrender.com/"),
  };
  
  export default config;
  