# FloodLens Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                                │
│                   (Frontend - Next.js)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  - UI Components                                     │    │
│  │  - Auth (via Supabase)                              │    │
│  │  - Data Access Requests (via Supabase)              │    │
│  │  - API Routes: /api/admin, /api/user, /api/download │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                              │
│                   (Auth + PostgreSQL)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Tables:                                             │    │
│  │  - profiles (user profiles)                          │    │
│  │  - data_requests (access requests)                   │    │
│  │  - data_request_downloads (download logs)            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        RENDER                                │
│                   (Backend - Express)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  - SQLite Database (flood_hyderabad.db - 617MB)     │    │
│  │  - /api/stats - Flood statistics                     │    │
│  │  - /api/events - Flood events data                   │    │
│  │  - /api/flood-data - Raw data for downloads          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Supabase Setup

### 1.1 Create Tables
Run `supabase-schema.sql` in Supabase SQL Editor to create:
- `profiles` table
- `data_requests` table
- `data_request_downloads` table

### 1.2 Setup RLS Policies
Run `RESET-DATABASE.sql` in Supabase SQL Editor to configure Row Level Security.

### 1.3 Get Supabase Credentials
From Supabase Dashboard → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` - Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - service_role key (keep secret!)

### 1.4 Configure Google OAuth (Optional)
If using Google Sign-In:
1. Go to Supabase → Authentication → Providers → Google
2. Add your Google OAuth credentials
3. Set redirect URL to: `https://your-vercel-domain.vercel.app/auth/callback`

---

## Step 2: Render Backend Setup

### 2.1 Prepare Backend for Deployment

The backend folder (`/backend`) needs these updates:

**Create `/backend/.env.example`:**
```env
PORT=3001
FRONTEND_URL=https://your-vercel-domain.vercel.app
NODE_ENV=production
```

**Update `/backend/package.json` scripts:**
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "ts-node src/index.ts"
  }
}
```

### 2.2 Upload Database to Render

**Option A: Include in Repo (Not Recommended - 617MB)**
- Add `flood_hyderabad.db` to the backend folder
- Update `.gitignore` to NOT ignore it

**Option B: Use Render Disk (Recommended)**
1. Create a Render Web Service
2. Add a Disk in Render Dashboard (1GB should be enough)
3. Mount it at `/data`
4. Upload your database via SSH or Render Shell:
   ```bash
   # In Render Shell
   curl -o /data/flood_hyderabad.db YOUR_DATABASE_URL
   ```
5. Update `backend/src/config/database.ts`:
   ```typescript
   const dbPath = process.env.SQLITE_DB_PATH || '/data/flood_hyderabad.db';
   ```

### 2.3 Deploy to Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `PORT`: 3001
   - `FRONTEND_URL`: Your Vercel URL
   - `SQLITE_DB_PATH`: `/data/flood_hyderabad.db` (if using Disk)
   - `NODE_ENV`: production

### 2.4 Get Backend URL
After deployment, note your Render URL: `https://your-backend.onrender.com`

---

## Step 3: Vercel Frontend Setup

### 3.1 Update Frontend to Use Backend API

**Create `/frontend/.env.example`:**
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

### 3.2 Deploy to Vercel

1. Import project to Vercel from GitHub
2. Set **Root Directory**: `frontend`
3. Add Environment Variables in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_BACKEND_URL` (your Render URL)

### 3.3 Update Supabase Redirect URLs
In Supabase → Authentication → URL Configuration:
- **Site URL**: `https://your-vercel-domain.vercel.app`
- **Redirect URLs**: Add `https://your-vercel-domain.vercel.app/auth/callback`

---

## Step 4: Post-Deployment Checklist

- [ ] Supabase tables created (`profiles`, `data_requests`, `data_request_downloads`)
- [ ] Supabase RLS policies applied
- [ ] Backend deployed on Render with database
- [ ] Frontend deployed on Vercel
- [ ] Environment variables set on both platforms
- [ ] Google OAuth redirect URL updated (if using)
- [ ] Test: User signup/login
- [ ] Test: Submit data access request
- [ ] Test: Admin approve request
- [ ] Test: User download data (CSV/Excel)

---

## Environment Variables Summary

### Vercel (Frontend)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_BACKEND_URL` | Render backend URL |

### Render (Backend)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (3001) |
| `FRONTEND_URL` | Vercel frontend URL (for CORS) |
| `SQLITE_DB_PATH` | Path to SQLite database |
| `NODE_ENV` | production |

---

## Important Notes

1. **Database Size**: Your SQLite database is 617MB. Render's free tier has limited disk space. Consider:
   - Render Starter plan with 1GB disk
   - Or use a managed PostgreSQL and migrate data

2. **Cold Starts**: Render free tier spins down after inactivity. First request may take 30-60 seconds.

3. **CORS**: Backend must allow requests from your Vercel domain.

4. **Admin Access**: Admin email is hardcoded as `divyanshece242@gmail.com` in:
   - `/frontend/src/components/Header.tsx`
   - `/frontend/src/app/admin/page.tsx`

   Change these if needed before deployment.

---

## Files to Keep

```
flood-dashboard/
├── backend/                    # Deploy to Render
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Deploy to Vercel
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.ts
├── flood_hyderabad.db          # Upload to Render Disk
├── supabase-schema.sql         # Run in Supabase (keep for reference)
├── RESET-DATABASE.sql          # Run in Supabase (keep for reference)
└── DEPLOYMENT-GUIDE.md         # This file (delete after deployment)
```

---

## Delete After Reading

Once you've completed deployment, you can delete:
- This file (`DEPLOYMENT-GUIDE.md`)
- `RESET-DATABASE.sql` (after running in Supabase)
- `supabase-schema.sql` (after running in Supabase)
