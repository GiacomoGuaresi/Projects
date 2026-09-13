import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// base = nome del repository, perché il sito è servito da GitHub Pages
// su giacomoguaresi.github.io/Projects/
export default defineConfig({
  base: '/Projects/',
  plugins: [
    react(),
    tailwindcss(),
    // PWA come in Grocery: installabile, con la shell dell'app in cache. I dati
    // non passano dal service worker (doc/03: nessun offline dei dati). Le icone
    // le genera `npm run icone` da public/icona.svg.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icona.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Projects',
        short_name: 'Projects',
        description: 'Le attività di casa, raggruppate per progetto',
        lang: 'it',
        display: 'standalone',
        // Come l'intestazione e lo sfondo dell'app (index.css).
        theme_color: '#587654',
        background_color: '#f3f8f0',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
