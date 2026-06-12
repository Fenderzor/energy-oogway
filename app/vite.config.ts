import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Energy Oogway',
        short_name: 'Oogway',
        description: 'Your energy news & thermodynamics study companion.',
        theme_color: '#0e7c5a',
        background_color: '#0a3b2c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell is precached automatically. Data files use runtime caching:
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/data/news/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'eo-news',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/data/decks/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'eo-decks', expiration: { maxEntries: 50 } },
          },
        ],
      },
      // Service worker only in production builds; keeps dev simple.
      devOptions: { enabled: false },
    }),
  ],
})
