import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192x192.png', 'icon-512x512.png'],

      manifest: {
        name: 'VigneApp',
        short_name: 'VigneApp',
        description: 'Gestion de l\'exploitation viticole',
        theme_color: '#000a18',
        background_color: '#000a18',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },

      workbox: {
        // ✅ FIX ERREUR
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  optimizeDeps: {
    include: ['@shadergradient/react'],
  },

  ssr: {
    noExternal: ['@shadergradient/react'],
  },

  // 🚀 AJOUT IMPORTANT
  build: {
    chunkSizeWarningLimit: 1000, // optionnel (juste pour virer le warning)

    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          shader: ['@shadergradient/react'],
          // ajoute ici d'autres libs lourdes si besoin
        }
      }
    }
  }
})