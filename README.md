# Sab Kuch 🛍️

> **"Sab Kuch"** (Everything) — A Progressive Web App for food, grocery, pharmacy & general local delivery.

## Monorepo Structure

```
sabkuch/
├── backend/     Express.js + TypeScript + Prisma + NeonDB
└── frontend/    React + Vite + TypeScript + Tailwind + PWA
```

## Running Locally

### 1. Backend

```bash
cd backend
cp .env.example .env        # configure DATABASE_URL, RESEND_API_KEY, JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev                  # → http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                  # → http://localhost:3000
```

The Vite dev server proxies `/api/*` to `localhost:5000` automatically.

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · Zustand · Lucide |
| Backend   | Express.js · TypeScript · Prisma ORM |
| Database  | NeonDB (PostgreSQL) |
| Email     | Resend (passwordless OTP) |
| PWA       | vite-plugin-pwa · Workbox |
| Font      | Poppins (all weights) |
| Theme     | Primary: `#ff4500` (orangered) |
