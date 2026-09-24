import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'Dhwani_AI_transparent_192x192.png', 'Dhwani_AI_transparent_512x512.png'],
      manifest: {
        name: 'Dhwani AI',
        short_name: 'Dhwani AI',
        description: 'AI-Powered Voice Cloning & Scam Call Protection',
        theme_color: '#0D1B2A',
        background_color: '#0D1B2A',
        display: 'standalone',
        icons: [
          {
            src: '/Dhwani_AI_transparent_192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/Dhwani_AI_transparent_512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
});

