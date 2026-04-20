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
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
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
