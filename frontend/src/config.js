const config = {
    // Use /api prefix for development to leverage Vite proxy
    // In production, you would set this to your actual backend URL
    BASE_URL: import.meta.env.DEV ? "/api" : "http://localhost:3000",
  };
  
  export default config;
  