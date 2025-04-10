import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      // registerType: "autoUpdate",
            // registerType: "autoUpdate", // Keep this commented out
            devOptions: {
        enabled: true, // Explicitly enable PWA features in development
        type: 'module', // Recommended type for modern browsers
      },
    }),
  ],
});
