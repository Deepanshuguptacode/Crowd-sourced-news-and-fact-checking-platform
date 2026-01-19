const config = {
    // Use environment variable for backend URL in production
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 
              (import.meta.env.DEV ? "http://localhost:3000" : "https://api.voxveritas.me"),
    // Face auth URL (via Cloudflare)
    FACE_AUTH_URL: import.meta.env.VITE_FACE_AUTH_URL || 
                   (import.meta.env.DEV ? "http://127.0.0.1:5000" : "https://api.voxveritas.me/face-auth"),
  };
  
  export default config;
  