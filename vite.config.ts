import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // registerType: "autoUpdate",
      // registerType: "autoUpdate", // Keep this commented out
      // Add manifest options
      manifest: {
        name: 'ReBang', // Replace with your actual app name if different
        short_name: 'ReBang', // Replace if needed
        description: 'DuckDuckGo Bang redirects in your browser', // Add a description
        theme_color: '#000000', // Added theme color (adjust as needed)
        // Add other manifest properties like icons, start_url, etc. if not already defined
        // Example icons structure (ensure these files exist in /public):
        /*
        icons: [
          {
            src: 'ReBangLogoBG.png', // Example path
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'ReBangLogoBG.png', // Example path
            sizes: '512x512',
            type: 'image/png'
          }
        ]
        */
      },
      // Runtime caching for bangs.[hash].json - cache forever since filename changes on update
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/bangs\.[a-f0-9]+\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bangs-cache',
              expiration: {
                maxEntries: 2, // Keep current + 1 old version
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    }),
  ],
});
