# Deployment Checklist for Leave Management System

## Pre-Deployment Setup

### 1. Environment Variables
Create `.env` files for both frontend and backend.

#### Backend `.env`:
```
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h
```

#### Frontend `.env`:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 2. Backend CORS Configuration
Ensure `backend/server.js` allows requests from your Vercel frontend domain.

### 3. Database
SQLite is file-based and will persist on Render.

### 4. Build Test
Run locally in production mode before deploying:
```bash
# Backend
cd backend
npm start

# Frontend (in new terminal)
cd frontend
npm run build
npm run preview
```

---

## Deployment Steps

### PHASE 1: Deploy Backend to Render

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: leave-management-api
   - **Region**: Singapore (closest to you)
   - **Branch**: master
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add Environment Variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy the deployed URL (e.g., https://leave-management-api.onrender.com)

### PHASE 2: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign up/login with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: frontend
   - **Build Command**: npm run build
   - **Output Directory**: dist
5. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-render-url.onrender.com/api` (from Phase 1)
6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Your app is live! 🎉

### PHASE 3: Update CORS (After Both Deployed)

1. Update `backend/server.js` CORS to allow Vercel domain
2. Commit and push changes
3. Render will auto-deploy

---

## Post-Deployment

### Test Credentials:
| Role | Email | Password |
|------|-------|----------|
| Student | student.cse1@college.edu | password123 |
| Staff | staff.cse1@college.edu | password123 |
| HOD | hod.cse@college.edu | password123 |
| Principal | principal@college.edu | password123 |

### Important Notes:
1. **Render Free Tier**: Sleeps after 15 mins inactivity (30s wake-up time)
2. **SQLite**: Data persists on Render's disk
3. **Custom Domain**: Can add on Vercel Pro or use default .vercel.app
4. **Logs**: View in Render dashboard for debugging

---

## Troubleshooting

### Issue: CORS errors
**Fix**: Update backend CORS origin to match Vercel URL

### Issue: API calls failing
**Fix**: Check VITE_API_URL is correct and backend is running

### Issue: Database not persisting
**Fix**: On Render, use Disk feature (adds persistent storage)

---

## URLs After Deployment
- **Frontend**: https://your-project.vercel.app
- **Backend**: https://your-api.onrender.com
- **API Docs**: https://your-api.onrender.com/api
