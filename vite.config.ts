import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  server: {
    proxy: {
      '/api/tv': {
        target: 'https://scanner.tradingview.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/tv/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Origin: 'https://www.tradingview.com',
          Referer: 'https://www.tradingview.com/',
        },
      },
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/yahoo/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      },
    },
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
})
