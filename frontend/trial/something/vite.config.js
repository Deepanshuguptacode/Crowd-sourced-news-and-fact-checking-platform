import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   server: {
    proxy: {
      '/api': {
        target: 'https://74w9sg4h-3000.inc1.devtunnels.ms/',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, 'http://localhost:3000/api/')
      }
    }
  }

  
})
