import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base = nome del repository, perché il sito è servito da GitHub Pages
// su giacomoguaresi.github.io/Projects/
export default defineConfig({
  base: '/Projects/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
