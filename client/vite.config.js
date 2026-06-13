import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'DP Home Electric Services Admin',
        short_name: 'DP Electric',
        description: 'Admin and booking dashboard for DP Home Electric Services.',
        theme_color: '#F59E0B',
        background_color: '#FAFAFA',
        display: 'standalone',
        start_url: '/admin/dashboard',
        icons: [
          {
            src: '/logo.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any maskable',
          },
          {
            src: '/logo.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
