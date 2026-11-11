import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../services/auth';
import { wakeUpBackend } from '../utils/apiUtils';

// Función para despertar el backend antes de login
const localWakeUpBackend = async () => {
  try {
    await wakeUpBackend();
  } catch (err) {
    console.warn('[Auth] Health check failed, but continuing:', err.message);
  }
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      cargarUsuario();
    } else {
      setLoading(false);
    }
  }, []);

  const cargarUsuario = async () => {
    try {
      const response = await axiosInstance.get('usuario-actual/');
      setUser(response.data);
      // Guardar el rol del usuario para el fondo animado
      if (response.data && response.data.rol) {
        const validRoles = ['admin', 'doctor', 'nurse', 'patient'];
        const rol = response.data.rol.toLowerCase();
        if (validRoles.includes(rol)) {
          try {
            localStorage.setItem('user_role', rol);
          } catch (e) {
            console.warn('No se pudo guardar el rol en localStorage:', e);
          }
          document.documentElement.setAttribute('data-role', rol);
        }
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
      } catch (e) {
        console.warn('No se pudo limpiar localStorage:', e);
      }
      document.documentElement.removeAttribute('data-role');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // Despertar el backend antes del login
      await localWakeUpBackend();
      
      const response = await axiosInstance.post('token/', {
        username,
        password
      });

      if (response.data && response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
        
        // Cargar usuario después del login exitoso
        await cargarUsuario();
        return { success: true };
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // Helper to get current token
  const getToken = () => localStorage.getItem('access_token');

  const logout = () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
    } catch (e) {
      console.warn('No se pudo limpiar localStorage:', e);
    }
    document.documentElement.removeAttribute('data-role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, cargarUsuario, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};