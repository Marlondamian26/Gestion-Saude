import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// [FASE 6 §6.2] Sentry — inicializar solo si hay DSN configurado
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn) {
  // Dynamic import para no incluir Sentry en builds sin DSN
  import('@sentry/react').then(Sentry => {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
      beforeSend(event) {
        // Sanitizar headers sensibles
        if (event.request?.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.Cookie;
        }
        return event;
      },
    });
  }).catch(() => {
    console.warn('[FASE 6 §6.2] Sentry no disponible, logging deshabilitado');
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
