/**
 * Central API configuration for AfriDev Hub.
 * Points to the deployed Spring Boot backend on Systalink if deployed externally,
 * or localhost:8081 during local development.
 */
const LIVE_BACKEND_URL = 'https://afridev-hub-711d9935.platform-systalink.com/api/v1';

export const API_BASE_URL: string = (() => {
  if (typeof window === 'undefined') {
    return LIVE_BACKEND_URL;
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8081/api/v1';
  }
  if (window.location.hostname.includes('afridev-hub-711d9935')) {
    return '/api/v1';
  }
  return LIVE_BACKEND_URL;
})();

export function getFullUploadUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  if (cleanPath.startsWith('/api/v1')) {
    const baseDomain = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    return baseDomain + cleanPath;
  }
  return API_BASE_URL + cleanPath;
}
