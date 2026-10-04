import React from 'react';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import './App.css';
import './styles/components-responsive.css';

// Context — import estáticos (pequeños, se usan en todas partes)
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import { LanguageProvider } from './context/LanguageContext';

// Services
import { setErrorHandler } from './services/errorHandler';

// Components — imports estáticos (landing + auth, primer render)
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import Registro from './components/Registro';

// [FASE 7 §7.2.2] Lazy-loaded route components (solo se descargan al navegar)
const Dashboard = lazy(() => import('./components/Dashboard'));
const Citas = lazy(() => import('./components/Citas'));
const Doctores = lazy(() => import('./components/Doctores'));
const Perfil = lazy(() => import('./components/Perfil'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const EnfermeriaDashboard = lazy(() => import('./components/EnfermeriaDashboard'));
const SitioPromocionalLanding = lazy(() => import('./sitioPromocional/components/LandingWrapper'));
const ChatIA = lazy(() => import('./components/chat/ChatIA'));

// Theme/Language toggles — usados en header, import estáticos
import ThemeToggle from './components/ThemeToggle';
import LanguageToggle from './components/LanguageToggle';
import PromocionalToggle from './components/PromocionalToggle';
import Footer from './components/Footer';
import { APP_NAME } from './config/constants';

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100vw',
    overflowX: 'hidden',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: '100vw',
    overflowX: 'hidden',
  },
  headerBar: {
    position: 'fixed',
    top: 'clamp(15px, 3vw, 20px)',
    right: 'clamp(15px, 3vw, 20px)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(10px, 2vw, 15px)',
    alignItems: 'flex-end',
  },
};

function PageLoader() {
  return <div className="page-loader">Cargando...</div>;
}

function HeaderBar({ isPromocional }) {
  return (
    <div style={styles.headerBar}>
      <PromocionalToggle />
          {!isPromocional && (
          <>
            <ThemeToggle />
            <LanguageToggle />
          </>
        )}
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isPromocional = location.pathname === '/' || location.pathname === '/promocional';

  return (
    <div style={styles.appContainer}>
      <HeaderBar isPromocional={isPromocional} />

      <div style={styles.contentContainer}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/promocional" element={<SitioPromocionalLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/citas" element={<Citas />} />
            <Route path="/doctores" element={<Doctores />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/enfermeria" element={<EnfermeriaDashboard />} />
            <Route path="/chat" element={<ChatIA />} />
            <Route path="/" element={<SitioPromocionalLanding />} />
          </Routes>
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  // [FASE 4 §4.4.3] Configurar handler global de errores de API
  React.useEffect(() => {
    setErrorHandler((message, type) => {
      console.error(`[API ${type}]`, message);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      }
    });
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificacionesProvider>
            <Router>
              <ErrorBoundary key="app">
                <AppContent />
              </ErrorBoundary>
            </Router>
          </NotificacionesProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
