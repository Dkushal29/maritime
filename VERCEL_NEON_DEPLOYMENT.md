# MARITIME AI — Vercel & Neon PostgreSQL Deployment Guide

This guide provides step-by-step instructions for taking **MARITIME AI** live using **Vercel** (for the Next.js frontend), **Neon DB** (serverless PostgreSQL), and a cloud host (Render, Railway, Fly.io, or Docker) for the FastAPI machine learning backend.

---

## Architecture Overview

```
 ┌──────────────────────────────────────────────────────────┐
 │                  VERCEL (Frontend)                       │
 │  Next.js 16 + React 19 + TailwindCSS + Leaflet           │
 │  NEXT_PUBLIC_API_BASE_URL -> Backend API                 │
 └────────────────────────────┬─────────────────────────────┘
                              │ HTTPS / REST / WebSockets
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │              FASTAPI BACKEND (Cloud / Container)         │
 │  Render / Railway / Fly.io / Docker                      │
 │  OR-Tools + XGBoost + Chronos-Bolt + Psycopg 3           │
 └────────────────────────────┬─────────────────────────────┘
                              │ TLS (sslmode=require)
                              ▼
 ┌──────────────────────────────────────────────────────────┐
 │               NEON DB (Serverless PostgreSQL)            │
 │  22 Domain Schema Tables + Alembic Versioning            │
 │  Connection Pooling (PgBouncer) + Pre-ping & Auto-recycle│
 └──────────────────────────────────────────────────────────┘
```

---

## 1. Neon DB Setup & Verification

### A. Connection String
In your [Neon Console](https://console.neon.tech), create or open your database project. Copy your connection URI (using the pooled connection):

```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-snowy-pine-ae8ojpf0-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### B. Provision & Seed Neon DB with One Command
Run the included turnkey provisioning tool:

```powershell
python backend/db/setup_neon.py
```

This script will:
1. Probe network and verify SSL handshake with Neon.
2. Initialize all 22 domain schema tables under `public`.
3. Populate baseline reference datasets (ports, terminals, berths, route corridors, vessels catalog).
4. Synchronize all PostgreSQL auto-increment sequences.
5. Print a live record audit verifying all tables.

---

## 2. Deploying the Backend API (Render / Railway / Fly.io)

Since the backend includes PyTorch, Chronos-Bolt, and Google OR-Tools, it runs as a dedicated Python container service.

### Option A: 1-Click Render Deployment
1. Connect your GitHub repository to [Render](https://render.com).
2. Render automatically detects [`render.yaml`](file:///C:/Maritime/render.yaml).
3. Set the following environment variables in Render:
   - `DATABASE_URL`: Your Neon connection string.
   - `FRONTEND_URL`: Your Vercel domain (e.g., `https://your-maritime.vercel.app`).
   - `ALLOWED_ORIGINS`: `https://your-maritime.vercel.app`.
   - `AISSTREAM_API_KEY`: *(Optional)* Your AIS live stream key.
4. Click **Deploy**. Note your service URL (e.g., `https://maritime-ai-backend.onrender.com`).

### Option B: Railway Deployment
1. Import repository on [Railway](https://railway.app).
2. Use the root [`Dockerfile`](file:///C:/Maritime/Dockerfile) or set root directory to `backend/`.
3. Set `DATABASE_URL` and `PORT=8000`.

### Option C: Docker Container
```bash
docker build -t maritime-backend .
docker run -p 8000:8000 -e DATABASE_URL="postgresql://..." maritime-backend
```

---

## 3. Deploying the Frontend to Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import the `maritime` GitHub repository.
3. Vercel automatically detects the Next.js framework and uses `npm run build`.
4. In **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_BASE_URL = https://your-backend-api.onrender.com
   NEXT_PUBLIC_API_URL      = https://your-backend-api.onrender.com
   ```
5. Click **Deploy**.
6. The app will build in ~40 seconds and go live on your `*.vercel.app` domain.

---

## 4. Verification Checklist

| Step | Component | Verification Check |
| :--- | :--- | :--- |
| 1 | **Neon DB** | Run `python backend/db/setup_neon.py` -> Confirms 22 tables and seeded records |
| 2 | **Backend Health** | Query `https://your-backend.com/health` -> Returns `{"status": "ok", "database": "connected", "database_dialect": "postgresql"}` |
| 3 | **CORS** | Backend allows `*.vercel.app` automatically via regex in `backend/main.py` |
| 4 | **Frontend UI** | Open live Vercel URL -> Verify Dashboard, Planning, Routes Map, and Simulation |
| 5 | **PostgreSQL Persistence** | Create a Cargo Plan in `/planning` -> Verify fixture is saved in Neon DB |

---

## 5. Security & Production Best Practices

- **Never commit `.env` files**: All secrets are ignored via [`.gitignore`](file:///C:/Maritime/.gitignore).
- **SSL Enforcement**: Psycopg 3 connects to Neon with TLS enforced (`sslmode=require`).
- **Connection Recycled**: SQLAlchemy connection pool recycles idle sockets every 300s to avoid serverless timeouts.
- **Security Headers**: [`vercel.json`](file:///C:/Maritime/vercel.json) enforces `nosniff`, `DENY` framing, and XSS protection.
