# VoxVeritas Frontend - Vercel Deployment Guide

## Deployment Steps

### 1. Prerequisites
- GitHub repository connected to Vercel
- Backend deployed on GCP VM: `http://34.131.44.0`

### 2. Deploy to Vercel

**Option A: Vercel CLI**
```bash
npm install -g vercel
cd frontend
vercel login
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. Add Environment Variable:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `http://34.131.44.0`

5. Click **Deploy**

### 3. Update Backend CORS

After deployment, update your backend to allow the Vercel frontend URL:

In `backend/index.js`, add your Vercel URL to CORS origins:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://34.131.44.0',
  'https://your-vercel-app.vercel.app', // Add your Vercel URL
  'https://voxveritas.vercel.app'
];
```

### 4. Custom Domain (Optional)

In Vercel Dashboard:
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., voxveritas.me)
3. Follow DNS configuration instructions

### 5. Environment Variables

The app uses:
- **Development:** `http://localhost:3000`
- **Production:** `http://34.131.44.0` (from `.env.production`)

### 6. Test Deployment

Visit your Vercel URL and test:
- User registration/login
- News feed loading
- Face authentication
- Debate rooms
- API connectivity

## Build Locally

```bash
cd frontend
npm install
npm run build
npm run preview  # Test production build locally
```

## Troubleshooting

**CORS Errors:**
- Ensure backend CORS includes your Vercel URL
- Check `backend/index.js` CORS configuration

**API Connection Issues:**
- Verify `VITE_API_BASE_URL` is set correctly in Vercel
- Check backend is running: `http://34.131.44.0/health`

**Build Errors:**
- Clear cache: `rm -rf node_modules dist && npm install`
- Check Node.js version compatibility (18+)

## Important Notes

- Frontend uses `http://` for GCP VM (not HTTPS yet)
- For production, set up HTTPS with Let's Encrypt on GCP VM
- Update `VITE_API_BASE_URL` to `https://` after SSL setup
