# Sab Kuch — Frontend

React + Vite + TypeScript + Tailwind CSS + shadcn/ui PWA

## Quick Start

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # → http://localhost:3000
```

## Key Routes

| Path | Description |
|------|-------------|
| `/get-app` | App Store mimic landing page (QR scan entry point) |
| `/auth` | Email OTP login |
| `/` | Home — greeting, banners, trending products |
| `/shops` | Shop listing with filters |
| `/custom` | Multi-step custom order form |
| `/orders` | My orders (active + history) |
| `/settings` | Profile + preferences |
| `/admin` | Admin dashboard (ADMIN role only) |

## Architecture

```
src/
├── App.tsx              # Router + beforeinstallprompt capture
├── main.tsx             # React entry point
├── styles/globals.css   # Tailwind + CSS variables
├── lib/
│   ├── apiClient.ts     # Axios with JWT interceptor
│   ├── pwa.ts           # PWA install utilities (iOS/Android)
│   └── utils.ts         # cn() tailwind merge
├── types/index.ts       # Shared TypeScript types
├── store/
│   ├── authStore.ts     # Zustand auth state (persisted)
│   └── cartStore.ts     # Zustand cart (persisted, guest-friendly)
├── hooks/
│   ├── useAuth.ts       # OTP request + verify
│   ├── useVendors.ts    # Vendor list + single vendor
│   ├── useProducts.ts   # Featured products
│   └── useOrders.ts     # My orders + place order
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx    # Shell with bottom nav
│   │   └── BottomNav.tsx    # 5-tab navigation
│   └── ui/              # shadcn/ui components
└── pages/
    ├── AppStoreMimic.tsx    # iOS/Android store mimic
    ├── AuthScreen.tsx       # OTP login
    ├── HomeScreen.tsx       # Greeting + banners + products
    ├── ShopsScreen.tsx      # Shop listing
    ├── CustomOrderScreen.tsx # Multi-step custom order
    ├── MyOrdersScreen.tsx   # Active + history orders
    ├── SettingsScreen.tsx   # Profile + settings
    └── AdminDashboard.tsx   # Admin panel
```

## PWA Install Flow

```
User scans QR → /get-app (AppStoreMimic)
      ↓
"Browse Now" → enters app as guest
      ↓
Guest can view shops + add to cart freely
      ↓
Clicks "Checkout" → login gate (/auth)
      ↓
After login → Android: beforeinstallprompt fires
             iOS: "Add to Home Screen" tooltip shown
```
