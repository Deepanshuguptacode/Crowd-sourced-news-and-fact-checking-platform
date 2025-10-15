const config = {
    // Use environment variable for backend URL in production
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 
              (import.meta.env.DEV ? "http://localhost:3000" : "https://voxveritas-backend.vercel.app"),
  };
  
  export default config;
  