// Capacitor native initialization
// This file is only imported on native platforms
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

export async function initializeCapacitor() {
  try {
    // Style the status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1a1a2e' });

    // Handle Android back button
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    // Hide splash screen after app loads
    await SplashScreen.hide();
  } catch (error) {
    console.warn('Capacitor initialization failed:', error);
  }
}
