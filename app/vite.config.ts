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
        // Precache the app shell, KaTeX fonts, AND all static study data (decks,
        // library, problems, quizzes, exam) so everything works fully offline.
        // News is excluded from precache and handled by runtime caching below,
        // so it can still refresh online while serving the last copy offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,json}'],
        globIgnores: ['**/data/news/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/data/news/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'eo-news',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      // Service worker only in production builds; keeps dev simple.
      devOptions: { enabled: false },
    }),
  ],
})
