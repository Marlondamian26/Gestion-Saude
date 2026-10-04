/**
 * ErrorBoundary.jsx — Boundary global para capturar errores de render en React.
 * FASE 4 §4.4.2.
 *
 * Cualquier error de render en componentes hijos mostrará un fallback
 * consistente en lugar de romper toda la aplicación.
 */
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

// ErrorFallback como componente funcional (usa el contexto de lenguaje)
const ErrorFallbackInner = ({ error, onReset }) => {
  const { t } = useLanguage();
  return (
    <div className="error-boundary-fallback" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>{t('error') || 'Error'}</h2>
      <p>{t('serverConnectionError') || 'Ocurrió un error inesperado.'}</p>
      <details style={{ margin: '1rem 0', color: '#666' }}>
        <summary>{t('view') || 'Ver detalles'}</summary>
        <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
          {error?.message || 'Unknown error'}
        </pre>
      </details>
      <button onClick={onReset} className="btn btn-primary">
        {t('back') || 'Volver'}
      </button>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log a consola; en FASE 6 se integra Sentry
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackInner
          error={this.state.error}
          onReset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
