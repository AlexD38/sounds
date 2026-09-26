import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'AA.svg',
        'favicon.svg',
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
      ],
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/assets/sounds/') &&
              url.pathname.endsWith('.mp3'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'aa-sound-library',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Ambient Architect',
        short_name: 'AA',
        description: 'Ambient sounds for focus and relaxation',
        theme_color: '#1a2423',
        background_color: '#1a2423',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'AA.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  define: {
    // On définit globalThis.AudioBuffer pour que le package 'audio'
    // ne tente pas de faire l'import dynamique de 'audio-buffer'
    'globalThis.AudioBuffer': 'window.AudioBuffer',
  },
  resolve: {
    alias: {
      // Sécurité supplémentaire : on redirige l'import vers le package installé
      'audio-buffer': 'audio-buffer',
    },
  },
  build: {
    target: 'es2022',
  },
  optimizeDeps: {
    // On exclut ces packages du pré-bundling pour éviter les erreurs d'analyse statique
    exclude: ['audio', 'audio-buffer'],
  },
});
