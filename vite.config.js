import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Ambient Architect',
        short_name: 'AA',
        description: 'Ambiant sounds for focus and relaxation',
        theme_color: '#000',
        icons: [
          {
            src: 'AA.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'AA.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
});
