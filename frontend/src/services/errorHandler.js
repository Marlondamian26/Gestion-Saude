/**
 * errorHandler.js — Sistema centralizado de manejo de errores de API.
 * FASE 4 §4.4.3.
 *
 * Permite configurar un handler global que el interceptor de Axios invocará
 * para errores no-401. Fallback: console.error.
 *
 * En FASE 6 se integrará con un sistema de notificaciones/toast.
 */

let errorHandler = null;

export const setErrorHandler = (handler) => {
  errorHandler = handler;
};

export const showError = (message, type = 'error') => {
  if (errorHandler) {
    errorHandler(message, type);
  } else {
    // Fallback: console.error estructurado
    console.error(`[API Error - ${type}]`, message);
  }
};

export default showError;
