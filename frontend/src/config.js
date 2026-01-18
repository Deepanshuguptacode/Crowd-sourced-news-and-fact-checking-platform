const config = {
    // Use environment variable for backend URL in production
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 
              (import.meta.env.DEV ? "http://localhost:3000" : "https://voxveritas-backend.vercel.app"),
    // Face auth URL (goes through nginx proxy)
    FACE_AUTH_URL: import.meta.env.VITE_API_BASE_URL ? 
                   `${import.meta.env.VITE_API_BASE_URL}/face-auth` :
                   (import.meta.env.DEV ? "http://127.0.0.1:5000" : "https://34.131.44.0/face-auth"),
  };
  
  export default config;
  