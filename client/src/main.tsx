import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Capacitor only on native platforms (check for capacitor:// protocol)
if (window.location.protocol === 'capacitor:') {
  // Dynamic import to avoid bundling Capacitor in web builds
  import('./capacitor-init').then(({ initializeCapacitor }) => {
    initializeCapacitor();
  }).catch((error) => {
    console.warn('Failed to initialize Capacitor:', error);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
