<div align="center">

# 🛍️ Sab Kuch (سب کچھ)

**A high-performance, mobile-first, multi-vendor hyperlocal marketplace and delivery Progressive Web App (PWA).**

[![Live Demo](https://img.shields.io/badge/Demo-sab--kuch.vercel.app-ff4500?style=for-the-badge&logo=vercel&logoColor=white)](https://sab-kuch.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-monorepo-layout">Monorepo Layout</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-endpoints">API Endpoints</a> •
  <a href="#-pwa--defensive-browser-strategy">PWA & OEM Strategy</a> •
  <a href="#-license">License</a>
</p>

</div>

---

## 📖 Overview

**Sab Kuch** (*meaning "Everything" in Urdu/Hindi*) is an open-source, full-stack, mobile-first marketplace built to power hyperlocal commerce and on-demand delivery for universities, residential campuses, and local neighborhoods.

Built with **React 19**, **Vite**, **Express.js**, **Prisma ORM**, and **PostgreSQL (NeonDB)**, Sab Kuch combines the fluid experience of an installable native mobile app with the discoverability and reach of the open web.

---

## 🌟 Key Features

### 🛍️ Customer Experience & Hyperlocal Marketplace
- **Curated Multi-Vendor Marketplace**: Browse neighborhood shops, restaurants, bakeries, grocery stores, and campus vendors with real-time open/closed operating statuses.
- **Dedicated Product & Shop Pages**: High-resolution imagery, stock tracking, price calculation, and direct product detail viewing.
- **Live Search & Category Filtering**: Instant fuzzy search across products, shops, and categories with search query caching.
- **Campus & Hostel Address Delivery**: Tailored address management for student campuses, hostels, room numbers, and custom delivery notes.
- **Unified Cart & Checkout**: Intuitive cart sheet with dynamic delivery fee calculations and smooth checkout workflow.
- **Order Lifecycle Tracking**: Live status updates across all stages: `PENDING` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED` ➔ `CANCELLED`.

### 📱 Progressive Web App (PWA) & Defensive Strategy
- **Installable Native-Like App**: Standalone display mode with custom splash screens, app icons, and theme color `#ff4500`.
- **Offline Caching with Workbox**: Custom service worker precaches application assets and serves runtime API fallbacks when disconnected.
- **Defensive OEM Browser Strategy**: Built-in detection for custom Android OEM browsers (Xiaomi Mi Browser, Samsung Internet, Vivo Browser, Oppo HeyTap, Infinix/Tecno Phoenix). Automatically redirects to Google Chrome via Android Intents or provides an interactive, copy-link visual guide for unsupported browsers.

### 🛡️ Admin & Vendor Management Backoffice
- **Role-Based Access Control**: Secure JWT-based authentication distinguishing standard customers from authorized administrators.
- **Vendor & Catalog Management**: Create, update, publish, or suspend vendors and their corresponding product catalogs.
- **Order Dispatch Board**: Oversee platform-wide incoming orders, update fulfillment statuses, and manage deliveries.
- **Banner & Promotion Manager**: Dynamic banner carousel controls for flash sales, seasonal announcements, and campus discounts.
- **Platform Analytics**: Live statistics on total orders, active vendors, customer count, and gross merchandise value.

### 🔐 Authentication & Notifications
- **Passwordless OTP Login**: Fast and secure verification via transactional email powered by Resend.
- **Google OAuth Integration**: 1-click Google Sign-in for seamless onboarding.
- **Web Push Notifications**: Web Push API support delivering real-time delivery alerts directly to the user's lock screen.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    Client["📱 Client (React 19 + PWA + Zustand)"]
    SW["⚡ Service Worker (Workbox + Push API)"]
    ViteProxy["🌐 Vite Reverse Proxy / Vercel Edge"]
    API["🚀 Express.js REST API (TypeScript)"]
    AuthMW["🔒 Auth & Rate Limit Middlewares"]
    Prisma["💎 Prisma ORM (v7.10)"]
    DB[("🐘 PostgreSQL / Neon Serverless")]
    Resend["📧 Resend Email (OTP)"]
    OAuth["🔑 Google OAuth Service"]

    Client <--> SW
    Client -->|HTTPS / REST| ViteProxy
    ViteProxy --> API
    API --> AuthMW
    AuthMW --> Prisma
    Prisma <--> DB
    API --> Resend
    API --> OAuth
```

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) · [Vite 8](https://vitejs.dev/) · [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Styling & UI Components** | [Tailwind CSS 4](https://tailwindcss.com/) · [Radix UI](https://www.radix-ui.com/) · [Lucide React](https://lucide.dev/) · [Sonner](https://sonner.emilkowal.ski/) |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) |
| **Progressive Web App** | [Vite PWA](https://vite-pwa-org.netlify.app/) · [Workbox](https://developer.chrome.com/docs/workbox) · Web Push API |
| **Backend API** | [Node.js 20+](https://nodejs.org/) · [Express 4](https://expressjs.com/) · [TypeScript](https://www.typescriptlang.org/) |
| **Database & ORM** | [PostgreSQL (Neon Serverless)](https://neon.tech/) · [Prisma 7.10](https://www.prisma.io/) |
| **Authentication** | JWT (`jsonwebtoken`) · Google OAuth 2.0 · Resend Email OTP |
| **Validation & Security** | [Zod](https://zod.dev/) · [Helmet](https://helmetjs.github.io/) · [CORS](https://github.com/expressjs/cors) · [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Tooling & Code Quality** | [ESLint 9 (Flat Config)](https://eslint.org/) · `typescript-eslint` · [pnpm](https://pnpm.io/) |

---

## 📁 Monorepo Layout

```text
sabkuch/
├── backend/                        # Express.js REST API
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema definition
│   │   └── seed.ts                 # Database seeder (5 shops + 50 products)
│   ├── src/
│   │   ├── controllers/            # Route controllers (auth, vendors, products, orders, admin)
│   │   ├── middleware/             # Auth, error handling, validation, rate limiting
│   │   ├── routes/                 # Express route definitions
│   │   ├── services/               # Notification, email, storage business logic
│   │   ├── types/                  # Backend TypeScript interfaces
│   │   └── server.ts               # Express application entrypoint
│   ├── eslint.config.mjs           # ESLint 9 Flat Configuration
│   └── package.json
│
├── frontend/                       # React 19 Progressive Web App
│   ├── public/                     # Icons, PWA manifest, service worker scripts
│   ├── src/
│   │   ├── components/             # Reusable UI widgets & layout wrappers
│   │   │   ├── layout/             # Navigation bars, bottom tabs, headers, install banners
│   │   │   ├── pwa/                # OEM browser guidance modal & install prompts
│   │   │   └── ui/                 # Buttons, inputs, dialogs, badges (Radix-based)
│   │   ├── hooks/                  # Custom React hooks (useVendors, useProducts, useOrders)
│   │   ├── lib/                    # API client, browser & device detection, PWA helpers
│   │   ├── pages/                  # Application screens (Home, Shops, Product, Cart, Admin)
│   │   ├── store/                  # Zustand stores (cart, auth, UI state)
│   │   ├── types/                  # Frontend TypeScript data models
│   │   ├── App.tsx                 # Root router configuration
│   │   └── main.tsx                # Client bootstrap & PWA registration
│   ├── eslint.config.mjs           # ESLint 9 Flat Configuration
│   └── package.json
│
└── README.md                       # Repository Documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** `>= 20.x`
- **pnpm** `>= 9.x` (`npm install -g pnpm`)
- **PostgreSQL Database** (or a free [NeonDB](https://neon.tech) cloud database)

---

### 1. Clone the Repository

```bash
git clone https://github.com/muhammadsherazsandila/sab-kuch.git
cd sab-kuch
```

---

### 2. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   Fill in your `.env` values:
   ```ini
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
   JWT_SECRET="your-secure-jwt-secret"
   RESEND_API_KEY="re_your_resend_api_key"
   ADMIN_SECRET="your-admin-secret"
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Initialize Database & Seed Data**:
   ```bash
   # Push schema to database
   pnpm exec prisma db push

   # Generate Prisma Client
   pnpm exec prisma generate

   # Seed database with 5 shops, categories, and 50+ curated products
   pnpm exec prisma db seed
   ```

5. **Start the Backend Dev Server**:
   ```bash
   pnpm run dev
   # 🚀 Server listening on http://localhost:5000
   ```

---

### 3. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Values for `.env`:
   ```ini
   VITE_API_URL=/api/v1
   VITE_GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
   ```

4. **Start the Frontend Dev Server**:
   ```bash
   pnpm run dev
   # ⚡ Local dev server running on http://localhost:3000
   ```

The Vite dev server automatically proxies all `/api/*` network requests to `http://localhost:5000`.

---

## 📡 API Endpoints

All REST API endpoints are versioned under `/api/v1`:

### Authentication & User
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/send-otp` | Request passwordless login OTP via email | Public |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP and issue JWT access token | Public |
| `POST` | `/api/v1/auth/google` | Authenticate with Google OAuth credential | Public |
| `GET` | `/api/v1/users/me` | Fetch authenticated profile & addresses | User |
| `PATCH` | `/api/v1/users/me` | Update name, phone, or preferences | User |
| `POST` | `/api/v1/users/me/addresses` | Add a new delivery address | User |

### Vendors & Products
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/vendors` | List active vendors with search & filter | Public |
| `GET` | `/api/v1/vendors/:slug` | Retrieve vendor details and menu/catalog | Public |
| `GET` | `/api/v1/products` | Paginated product list with category filter | Public |
| `GET` | `/api/v1/products/:id` | Get single product details and availability | Public |

### Orders & Checkout
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/orders` | Place a new order with items & delivery note | User |
| `GET` | `/api/v1/orders` | List order history for the authenticated user | User |
| `GET` | `/api/v1/orders/:id` | Detailed order summary with live status tracking | User |
| `POST` | `/api/v1/orders/:id/cancel` | Cancel a pending order | User |

### Admin Backoffice
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/admin/stats` | Platform-wide sales and order metrics | Admin |
| `POST` | `/api/v1/admin/vendors` | Onboard and configure a new vendor shop | Admin |
| `POST` | `/api/v1/admin/products` | Create or update inventory products | Admin |
| `PATCH` | `/api/v1/admin/orders/:id` | Update order fulfillment and delivery status | Admin |

---

## 🛡️ PWA & Defensive Browser Strategy

Many budget and mid-tier Android smartphones (e.g., Xiaomi, Redmi, POCO, Samsung, Vivo, Oppo, Realme, Infinix, Tecno) ship with proprietary OEM browsers as default (e.g. *MIUI Browser*, *HeyTap Browser*, *Phoenix Browser*). These browsers frequently:
- Strip the `beforeinstallprompt` event.
- Block Web App Manifest installation.
- Lack support for the Web Push API and background service workers.

### Our Multi-Tier Defense:
1. **Device & Browser Fingerprinting** (`browserDetection.ts`): Accurate UA and touch-capability analysis detecting OEM browsers, in-app WebViews (Instagram, Facebook, TikTok), and hardware manufacturer.
2. **Intent-Based Redirection**: On detected OEM browsers, the application triggers Android `intent://` scheme directives to automatically transition the user to standard **Google Chrome** with full PWA capability.
3. **Interactive Step-by-Step Visual Guide** (`OEMBrowserGuideModal.tsx`): If direct intent redirection is blocked by the OS, an interactive guide displays tailored visual steps for the user's exact device brand to copy the link and open it in Chrome, Firefox, or Safari.

---

## 🛠️ Monorepo Scripts

### Backend (`/backend`)
```bash
pnpm run dev              # Launch backend with tsx hot-reload
pnpm run build            # Prisma generate and TypeScript compilation
pnpm run lint             # ESLint check on src/**/*.ts
pnpm run prisma:generate  # Generate Prisma client types
pnpm run prisma:migrate   # Run Prisma database migrations
pnpm run prisma:seed      # Seed sample shops and products
pnpm run prisma:studio    # Open Prisma Studio web GUI
```

### Frontend (`/frontend`)
```bash
pnpm run dev              # Launch Vite dev server with HMR
pnpm run build            # Typecheck and build production PWA bundle
pnpm run lint             # ESLint flat check on TypeScript & React code
pnpm run preview          # Preview production build locally
```

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`).
4. Ensure code passes linting (`pnpm run lint` in both folders).
5. Push to the Branch (`git push origin feature/AmazingFeature`).
6. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/muhammadsherazsandila">Muhammad Sheraz Sandila</a></sub>
</div>
