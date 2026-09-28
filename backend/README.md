# Sab Kuch — Backend API

Express.js + TypeScript + Prisma + NeonDB

## Quick Start

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, RESEND_API_KEY, JWT_SECRET in .env

npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## API Base URL

`http://localhost:5000/api/v1`

## Auth Flow

1. `POST /api/v1/auth/request-otp` — send OTP to email
2. `POST /api/v1/auth/verify-otp` — verify OTP → receive JWT
3. Include `Authorization: Bearer <token>` on all protected routes

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/v1/auth/request-otp` | Public | Send OTP to email |
| POST | `/api/v1/auth/verify-otp` | Public | Verify OTP, get JWT |
| GET | `/api/v1/vendors` | Public | List vendors |
| GET | `/api/v1/vendors/:slug` | Public | Vendor + menu |
| GET | `/api/v1/products/featured` | Public | Featured products |
| POST | `/api/v1/orders` | Auth | Place order |
| POST | `/api/v1/orders/custom` | Auth | Custom order |
| GET | `/api/v1/orders/mine` | Auth | My orders |
| PATCH | `/api/v1/orders/:id/status` | Vendor/Admin | Update order status |
| GET | `/api/v1/users/me` | Auth | Own profile |
| GET | `/api/v1/admin/stats` | Admin | Platform stats |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run prisma:seed` | Seed sample data |

## Architecture

```
src/
├── index.ts           # Entry point — starts server
├── app.ts             # Express factory — middleware + routes
├── lib/
│   └── prisma.ts      # Singleton Prisma client
├── routes/            # Route definitions (thin layer)
├── controllers/       # Business logic
├── middleware/        # Auth, error handling
├── services/          # Email (Resend), storage
├── utils/             # logger, apiResponse, jwt
└── prisma/
    └── seed.ts        # Dev seed data
```
