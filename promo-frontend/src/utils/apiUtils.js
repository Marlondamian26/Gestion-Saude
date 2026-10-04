const getApiUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');
  }
  const defaultBackend = 'https://gestion-saude-backend.onrender.com/api';
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    return isLocal ? `${origin}/api` : defaultBackend;
  }
  return defaultBackend;
};

const API_URL = getApiUrl();

export const wakeUpBackend = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_URL.replace(/\/api$/, '')}/health/`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch (err) {
    console.warn('[API] Health check failed, but continuing:', err.message);
    return false;
  }
};

export async function fetchWithRetry(url, options = {}, retries = 3, timeout = 15000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      return response;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const backendOrigin = API_URL.replace(/\/api$/, '');
  if (path.startsWith('/media/')) return `${backendOrigin}${path}`;
  if (path.startsWith('/sitio/')) return `${backendOrigin}${path}`;
  return `${backendOrigin}/media/${path}`;
};

export { getApiUrl, API_URL };
export default API_URL;
