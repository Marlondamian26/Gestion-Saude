// API utility functions
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

// Función para despertar el backend (útil para Render free tier)
export const wakeUpBackend = async () => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL.replace('/api', '')}/health/`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (err) {
    console.warn('[API] Health check failed, but continuing:', err.message);
    return false;
  }
};

export { getApiUrl };