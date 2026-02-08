/**
 * Check if running on Capacitor native platform
 * Multiple checks for reliability
 */
const isNativePlatform = (() => {
  if (typeof window === 'undefined') return false;
  
  // Check 1: Capacitor protocol
  if (window.location.protocol === 'capacitor:') return true;
  
  // Check 2: Check for Capacitor global object
  if ((window as any).Capacitor) return true;
  
  // Check 3: Check for ionic or cordova
  if ((window as any).cordova || (window as any).ionic) return true;
  
  return false;
})();

/**
 * API base URL - empty for web (relative URLs), full URL for native apps
 */
export const API_BASE_URL = isNativePlatform
  ? 'https://storify.asia'
  : '';

/**
 * Build a full API URL. 
 * In browser: returns "/api/books" (relative)
 * In Capacitor: returns "https://storify.asia/api/books" (absolute)
 */
export function apiUrl(path: string): string {
  const url = `${API_BASE_URL}${path}`;
  // Debug logging (will be visible in Logcat)
  if (isNativePlatform) {
    console.log('[API] Native platform detected, using:', url);
  }
  return url;
}
