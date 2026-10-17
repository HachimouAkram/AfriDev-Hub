/**
 * Central API configuration for AfriDev Hub.
 * Automatically resolves to http://localhost:8081/api/v1 during local dev on port 4200,
 * and uses relative /api/v1 in production (Systalink / Docker Nginx).
 */
export const API_BASE_URL: string =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  window.location.port === '4200'
    ? '/api/v1'
    : '/api/v1';

export function getFullUploadUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  if (cleanPath.startsWith('/api/v1')) {
    return (API_BASE_URL.startsWith('http') ? ''' : '') + cleanPath;
  }
  return API_BASE_URL + cleanPath;
}
