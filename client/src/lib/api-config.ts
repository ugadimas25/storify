/**
 * Check if running on Capacitor native platform
 * We check the protocol instead of importing Capacitor to avoid build issues
 */
const isNativePlatform = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';

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
  return `${API_BASE_URL}${path}`;
}
