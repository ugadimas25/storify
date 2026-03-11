import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

// Debug: Log platform detection
console.log('[Platform] protocol:', window.location.protocol);
console.log('[Platform] Capacitor global:', !!(window as any).Capacitor);
console.log('[Platform] href:', window.location.href);

// Initialize Capacitor only on native platforms
const isNative = window.location.protocol === 'capacitor:' || !!(window as any).Capacitor;

if (isNative) {
  console.log('[Capacitor] Initializing native features...');
  // Dynamic import to avoid bundling Capacitor in web builds
  import('./capacitor-init').then(({ initializeCapacitor }) => {
    initializeCapacitor();
    console.log('[Capacitor] Initialization complete');
  }).catch((error) => {
    console.warn('[Capacitor] Failed to initialize:', error);
  });
} else {
  console.log('[Platform] Running in web mode');
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </HelmetProvider>
);

