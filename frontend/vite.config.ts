/**
 * Vite Configuration — Sab Kuch Frontend
 *
 * Key plugins:
 * - @vitejs/plugin-react       : Fast Refresh + JSX transform
 * - vite-plugin-pwa            : Service worker + manifest generation
 *
 * PWA config registers a service worker that:
 * - Caches app shell (offline-capable)
 * - Shows a custom install prompt
 */

import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],

      // ── Web App Manifest ────────────────────────────────────────────────────
      manifest: {
        id: "/",
        name: "Sab Kuch — Delivery App",
        short_name: "Sab Kuch",
        description:
          "Order food, groceries, medicines & more from local shops.",
        theme_color: "#ff4500",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png?v=2",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png?v=2",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png?v=2",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      // ── Workbox Strategy ────────────────────────────────────────────────────
      workbox: {
        importScripts: ['/custom-sw.js'],
        // Cache app shell aggressively; API calls are network-first
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        runtimeCaching: [
          {
            // API responses: network-first with 5s timeout, fallback to cache
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
          {
            // Google Fonts — cache-first for performance
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },

      devOptions: {
        // Enable PWA in development so we can test install prompts
        enabled: true,
        type: "classic",
      },
    }),
  ],

  // Path alias — allows "import X from '@/components/...' " anywhere
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },

  server: {
    host: true,
    port: 3000,
    // Proxy API calls to Express backend during development
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
