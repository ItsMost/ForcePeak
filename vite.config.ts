import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'favicon.svg'],
      manifest: {
        name: 'PF',
        short_name: 'PF',
        description: 'Peak Force Weekly Workout Planner',
        theme_color: '#f97316', // اللون البرتقالي للتطبيق
        background_color: '#0f172a', // لون الخلفية (الوضع الليلي)
        display: 'standalone', // **هذا السطر هو ما يخفي شريط المتصفح (Chrome/Safari)**
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png', // تأكد من وضع هذه الصورة في مجلد public
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png', // تأكد من وضع هذه الصورة في مجلد public
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
});
