/**
 * Utility functions for robust media uploads across development and Vercel hosting.
 */

/**
 * Returns the appropriate upload endpoint.
 * When hosted on Vercel (*.vercel.app), direct uploads to the Spring Boot backend
 * bypass Vercel's 4.5 MB serverless proxy request entity limit (HTTP 413).
 */
export function getUploadApiUrl(endpoint: 'image' | 'pdf' | 'video'): string {
  if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('vercel.app')) {
    return `https://afridev-hub-711d9935.platform-systalink.com/api/v1/uploads/${endpoint}`;
  }
  return `/api/v1/uploads/${endpoint}`;
}

export function resolveUploadedMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith('/api/v1/')
    ? trimmed
    : trimmed.startsWith('/uploads/')
      ? `/api/v1${trimmed}`
      : trimmed.startsWith('uploads/')
        ? `/api/v1/${trimmed}`
        : trimmed;
  if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('vercel.app') && normalizedPath.startsWith('/')) {
    return `https://afridev-hub-711d9935.platform-systalink.com${normalizedPath}`;
  }
  return normalizedPath;
}

/**
 * Client-side browser image compressor.
 * Downscales high-resolution photos (e.g. mobile screenshots, camera photos > 1 MB)
 * to a web-optimized JPEG/PNG under 1920px max dimension.
 * Ensures instant, smooth uploads that never trigger 413 / network timeouts.
 */
export async function compressImage(file: File, maxDimension = 1920, quality = 0.85): Promise<File> {
  // Pass non-raster or already small files directly
  if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }
  if (file.size <= 1024 * 1024) {
    return file; // Already under 1MB
  }

  return new Promise<File>((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(file);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

            canvas.toBlob(
              (blob) => {
                if (!blob || blob.size >= file.size) {
                  resolve(file);
                } else {
                  const compressedFile = new File([blob], file.name, {
                    type: outputMime,
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                }
              },
              outputMime,
              quality
            );
          } catch {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch {
      resolve(file);
    }
  });
}
