import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import './App.css';
import './styles/components-responsive.css';

// Context
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import { LanguageProvider } from './context/LanguageContext';

// Services
import { setErrorHandler } from './services/errorHandler';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import Registro from './components/Registro';
import Dashboard from './components/Dashboard';
import Citas from './components/Citas';
import Doctores from './components/Doctores';
import Perfil from './components/Perfil';
import AdminDashboard from './components/AdminDashboard';
import EnfermeriaDashboard from './components/EnfermeriaDashboard';
import ThemeToggle from './components/ThemeToggle';
import LanguageToggle from './components/LanguageToggle';
import PromocionalToggle from './components/PromocionalToggle';
import Footer from './components/Footer';
import { APP_NAME } from './config/constants';

// Sitio Promocional Components
import SitioPromocionalLanding from './sitioPromocional/components/LandingWrapper';

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
          <Route path="/" element={<SitioPromocionalLanding />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  // [FASE 4 §4.4.3] Configurar handler global de errores de API
  React.useEffect(() => {
    setErrorHandler((message, type) => {
      // En FASE 6 se integrará con toast/notification real
      console.error(`[API ${type}]`, message);
      // Notificación simple para usuarios
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
