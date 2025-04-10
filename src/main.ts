import "./tailwind.css";
import { App } from "./components/App";
import { performRedirect } from "./utils/redirect";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { bangWorker } from "./utils/workerUtils";
import { registerSW } from 'virtual:pwa-register';

/**
 * Main function to initialize the application
 */
function main(): void {
  inject();
  injectSpeedInsights();
  
  // Added PWA registration and update handling
  const updateSW = registerSW({
    onNeedRefresh() {
      // TODO: Basic confirm dialog - replace with better UI 
      if (confirm("New content available, reload?")) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log("App is ready to work offline");
      // TODO: Show a toast or notification
    },
  });
  
  // Initialize web worker early to speed up first search
  bangWorker.init();
  
  // Try to perform a redirect if there's a query parameter
  const redirected = performRedirect();
  
  // If no redirect was performed, render the default page
  if (!redirected) {
    const app = new App();
    const rootElement = document.querySelector<HTMLDivElement>("#app");
    
    if (rootElement) {
      app.render(rootElement);
    } else {
      console.error("Root element '#app' not found");
    }
  }
  
  // Add event listener for back button navigation
  window.addEventListener('popstate', () => {
    // Remove any existing loading overlays that might be present
    const existingOverlays = document.querySelectorAll('.fixed.inset-0.bg-\\[\\#000\\].bg-opacity-90.z-50');
    existingOverlays.forEach(overlay => {
      document.body.removeChild(overlay);
    });
    
    // Check if we need to redirect or show the home page
    const shouldRedirect = performRedirect();
    
    if (!shouldRedirect) {
      // If we're back at the home page, refresh to show the UI
      window.location.reload();
    }
  });
}

// Start the application
main();
