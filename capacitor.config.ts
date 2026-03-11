import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'asia.storify.app',
  appName: 'Storify',
  webDir: 'dist/public',
  server: {
    // Allow mixed content (http in https context) if needed
    androidScheme: 'https',
    // Allow navigation to external URLs (for DOKU payment, etc.)
    allowNavigation: [
      'app.storify.asia',
      '*.storify.asia',
      '*.doku.com',
      '*.pewacaold-1379748683.cos.ap-jakarta.myqcloud.com',
    ],
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '410832331375-auuvaac6i5ob8v76lvhm8ln7h3vgap0n.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#e2b857',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
