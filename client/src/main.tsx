import { createRoot } from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import App from "./App";
import "./index.css";

// Initialize Capacitor native features (dynamic imports to avoid web build issues)
if (Capacitor.isNativePlatform()) {
  Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/app'),
  ]).then(([{ StatusBar, Style }, { SplashScreen }, { App: CapApp }]) => {
    // Style the status bar
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#1a1a2e' }).catch(() => {});

    // Handle Android back button
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    // Hide splash screen after app loads
    SplashScreen.hide().catch(() => {});
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
