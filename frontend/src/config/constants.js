// src/config/constants.js
export const APP_NAME = 'Gestao-Saude'; // Portuguese version
export const APP_SLOGAN = 'Cuidando da sua saude com excelencia';
export const APP_VERSION = '1.0.0';

// Base URL for API calls — used by both axios and EventSource.
// In production this should match VITE_API_URL in render.yaml.
export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location
    ? `${window.location.origin}/api`
    : 'https://gestion-saude-backend.onrender.com/api'
);