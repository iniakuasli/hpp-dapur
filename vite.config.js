import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          charts: ["recharts"],
          icons: ["lucide-react"],
        },
      },
    },
  },
  plugins: [react(), VitePWA({
    injectRegister: "auto",
    registerType: "autoUpdate",
    includeAssets: ["favicon.svg", "pwa-192.svg", "pwa-512.svg", "apple-touch-icon.svg"],
    manifest: {
      name: "DapurHitung",
      short_name: "DapurHitung",
      description: "Aplikasi HPP dan harga jual kuliner yang bisa dipasang di Android dan iPhone.",
      theme_color: "#14140f",
      background_color: "#ffffff",
      display: "standalone",
      start_url: "/",
      scope: "/",
      icons: [
        {
          src: "/pwa-192.svg",
          sizes: "192x192",
          type: "image/svg+xml",
          purpose: "any"
        },
        {
          src: "/pwa-512.svg",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        },
        {
          src: "/apple-touch-icon.svg",
          sizes: "180x180",
          type: "image/svg+xml"
        }
      ]
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "google-fonts-stylesheets"
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-webfonts",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    }
  }), cloudflare()]
});