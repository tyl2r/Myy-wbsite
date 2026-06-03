# Deployment Guide

This project uses:
- **Vercel** for the Next.js frontend (`apps/web`)
- **Railway** for the NestJS backend (`apps/api`) + PostgreSQL + Redis

---

## 1. Deploy the Backend to Railway

### Step 1 — Create a Railway project
1. Go to [railway.app](https://railway.app) and sign up / log in
2. Click **New Project** → **Deploy from GitHub repo** → select this repo
3. Set the **Root Directory** to `Touchtech-project-main/apps/api`

### Step 2 — Add PostgreSQL with PostGIS
1. In your Railway project, click **+ New** → **Database** → **PostgreSQL**
2. After it provisions, click the database → **Variables** → copy `DATABASE_URL`
3. Run PostGIS extension: connect to the DB and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS citext;
   ```

### Step 3 — Add Redis
1. Click **+ New** → **Database** → **Redis**
2. Copy the `REDIS_URL` from its Variables tab

### Step 4 — Set environment variables on the API service
In the API service → **Variables**, add:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<from step 2>
REDIS_URL=<from step 3>
JWT_ACCESS_SECRET=<generate: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 32>
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=1209600
CORS_ORIGINS=https://YOUR_VERCEL_URL.vercel.app
THROTTLE_TTL=60
THROTTLE_LIMIT=120
```

### Step 5 — Deploy
Railway will auto-detect the `Dockerfile` and deploy. The `CMD` runs
`prisma migrate deploy` before starting the server.

Note your Railway API URL (e.g. `https://api-production-xxxx.up.railway.app`).

---

## 2. Deploy the Frontend to Vercel

### Step 1 — Update vercel.json
Open `vercel.json` and replace `YOUR_RAILWAY_API_URL` with your Railway URL:
```json
"destination": "https://api-production-xxxx.up.railway.app/api/v1/:path*"
```
Also update `NEXT_PUBLIC_WS_URL`.

### Step 2 — Import to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up / log in with GitHub
2. Click **Add New Project** → import this GitLab repo
   - If using GitLab: connect via **Import Git Repository** → paste the repo URL
3. Set **Root Directory** to `Touchtech-project-main`
4. Framework: **Next.js** (auto-detected)
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=/api/v1
   NEXT_PUBLIC_WS_URL=https://YOUR_RAILWAY_API_URL
   ```
6. Click **Deploy**

### Step 3 — Update CORS on Railway
Once Vercel gives you a URL (e.g. `https://routeshare.vercel.app`), go back to
Railway and update `CORS_ORIGINS` to that URL.

---

## 3. GitLab CI/CD Auto-Deploy (optional)

To have GitLab automatically deploy on every push to `main`:

### Vercel token
1. Go to Vercel → Settings → Tokens → Create token
2. In GitLab → Settings → CI/CD → Variables, add:
   - `VERCEL_TOKEN` = your token
   - `VERCEL_ORG_ID` = from `.vercel/project.json` after first deploy
   - `VERCEL_PROJECT_ID` = from `.vercel/project.json`

### Railway webhook
1. In Railway → your API service → Settings → **Deploy Webhook** → copy URL
2. In GitLab → CI/CD Variables, add:
   - `RAILWAY_WEBHOOK_URL` = the webhook URL

Now every push to `main` will automatically build, test, and deploy both apps.

---

## Local Development

```bash
# Start PostgreSQL + Redis
docker compose up -d postgres redis

# Backend
cd apps/api
cp .env.example .env          # fill in values
pnpm install
pnpm prisma:migrate
pnpm prisma db seed
pnpm start:dev

# Frontend (new terminal)
cd apps/web
pnpm install
pnpm dev
```

Or run everything with Docker:
```bash
docker compose up --build
```
