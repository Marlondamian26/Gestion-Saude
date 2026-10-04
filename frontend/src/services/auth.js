import axios from 'axios'
import { showError } from './errorHandler'

const getApiUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const url = import.meta.env.VITE_API_URL
    if (url) return url.replace(/\/$/, '')
  }

  const defaultBackend = 'https://gestion-saude-backend.onrender.com/api'

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1')
    return isLocal ? `${origin}/api` : defaultBackend
  }

  return defaultBackend
}

const API_URL = getApiUrl()

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Función para despertar el backend (útil para Render free tier)
const wakeUpBackend = async () => {
  try {
    console.log('[Auth] Waking up backend...');
    await axios.get(`${API_URL.replace('/api', '')}/health/`, { timeout: 5000 });
    console.log('[Auth] Backend is awake');
  } catch (err) {
    console.warn('[Auth] Health check failed, but continuing:', err.message);
  }
};

// Configura axios para incluir token automáticamente
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000
})

// Interceptor para agregar token a cada petición
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar tokens expirados
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // No redirigir para requests de login/registro
    const noRedirigirUrls = ['/token/', '/token/refresh/', '/registro/', '/doctores-publicos/', '/especialidades-publicas/', '/especialistas-publicos/']
    const isAuthRequest = noRedirigirUrls.some(url => originalRequest.url?.includes(url))
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true
      
      if (!isRefreshing) {
        isRefreshing = true
        
        try {
          const refreshToken = localStorage.getItem('refresh_token')
          if (!refreshToken) {
            throw new Error('No refresh token')
          }
          
          const response = await axios.post(`${API_URL}token/refresh/`, {
            refresh: refreshToken
          }, { timeout: 10000 })
          
          const newToken = response.data.access
          localStorage.setItem('access_token', newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          
          processQueue(null, newToken)
          isRefreshing = false
          
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user_role')
          
          // Solo redirigir si no estamos ya en login
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/registro')) {
            window.location.href = '/login'
          }
          
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
      
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
      .then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return axiosInstance(originalRequest)
      })
      .catch(err => {
        return Promise.reject(err)
      })
    }
    
    return Promise.reject(error)
  }
)

// [FASE 4 §4.4.3] Manejo centralizado de errores para códigos no-401.
// - 403 → "Sin permisos"
// - 5xx → "Error del servidor"
// - Network → "Sin conexión"
// - 404 → dejado para el caller (algunos endpoints usan 404 como "no existe")
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      showError('No se pudo conectar con el servidor. Verifique su conexión.', 'network');
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      showError('No tienes permisos para acceder a este recurso.', 'forbidden');
      return Promise.reject(error);
    }

    if (error.response?.status >= 500) {
      showError('Error del servidor. Por favor intenta más tarde.', 'server');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
)

export default axiosInstance
export { wakeUpBackend }