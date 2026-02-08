import { createRoot } from "react-dom/client";
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import App from "./App";
import "./index.css";

// Initialize Capacitor native features
if (Capacitor.isNativePlatform()) {
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
}

createRoot(document.getElementById("root")!).render(<App />);
