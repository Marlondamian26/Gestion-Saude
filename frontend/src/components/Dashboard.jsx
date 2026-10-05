import React, { useEffect, useState } from 'react'
import axiosInstance from '../services/auth'
import { useNavigate } from 'react-router-dom'
import { useNotificaciones } from '../context/NotificacionesContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ChatIA from './ChatIA';
import ReminderCards from './ReminderCards';

function Dashboard() {
  const { t } = useLanguage()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mostrarChatIA, setMostrarChatIA] = useState(false)
  const [stats, setStats] = useState({
    totalCitas: 0,
    citasProximas: 0,
    especialidades: 0,
    doctores: 0
  })
  const [citasList, setCitasList] = useState([])
  const navigate = useNavigate()
  const { noLeidas } = useNotificaciones();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        console.log('No hay token, redirigiendo a login')
        navigate('/login')
        return
      }

      try {
        console.log(t('loadingYourInfo'))
        const response = await axiosInstance.get('usuario-actual/')
        
        if (response.data && response.data.username) {
          setUser(response.data)
          setError('')
          
          // Cargar datos adicionales según el rol
          await loadAdditionalData()
        } else {
          console.error('Respuesta inválida del servidor:', response.data)
          setError(t('serverError'))
        }
      } catch (err) {
        console.error('Error detallado:', err)
        
        if (err.response) {
          console.error('Respuesta de error:', err.response.data)
          console.error('Status:', err.response.status)
          
          if (err.response.status === 401) {
            console.log('Token inválido, eliminando...')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setError(t('sessionExpired'))
            setTimeout(() => navigate('/login'), 2000)
          } else {
            setError(t('serverError') + ': ' + err.response.status)
          }
        } else if (err.request) {
          console.error('No hubo respuesta del servidor')
          setError(t('connectionError'))
        } else {
          console.error('Error en la petición:', err.message)
          setError(t('error') + ': ' + err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  // Cargar datos adicionales según el rol
  const loadAdditionalData = async () => {
    try {
      const [citasRes, especialidadesRes, doctoresRes] = await Promise.allSettled([
        axiosInstance.get('mis-citas/'),
        axiosInstance.get('especialidades-publicas/'),
        axiosInstance.get('doctores-publicos/')
      ])

      let citasData = []
      let especialidadesData = []
      let doctoresData = []

      if (citasRes.status === 'fulfilled') {
        citasData = Array.isArray(citasRes.value.data) ? citasRes.value.data : citasRes.value.data.results || []
      }

      // guardar lista completa de citas para recordatorios
      setCitasList(citasData)

      if (especialidadesRes.status === 'fulfilled') {
        especialidadesData = Array.isArray(especialidadesRes.value.data) ? especialidadesRes.value.data : especialidadesRes.value.data.results || []
      }

      if (doctoresRes.status === 'fulfilled') {
        doctoresData = Array.isArray(doctoresRes.value.data) ? doctoresRes.value.data : doctoresRes.value.data.results || []
      }

      // Calcular estadísticas
      const hoy = new Date().toISOString().split('T')[0]
      const citasProximas = citasData.filter(c => c.fecha >= hoy && c.estado !== 'cancelada').length

      setStats({
        totalCitas: citasData.length,
        citasProximas,
        especialidades: especialidadesData.length,
        doctores: doctoresData.length
      })
    } catch (err) {
      console.error('Error cargando datos adicionales:', err)
    }
  }

  const handleLogout = () => {
    console.log('Cerrando sesión...')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    // limpiar recordatorios de sesión
    try { sessionStorage.removeItem('dismissedReminders') } catch(e){}
    setUser(null)
    navigate('/login')
  }

  const handleNavigation = (path) => {
    console.log(`Navegando a: ${path}`)
    navigate(path)
  }

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>{t('loading')}</p>
      </div>
    )
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h2 style={styles.errorTitle}>Error</h2>
        <p style={styles.errorMessage}>{error}</p>
        <button 
          onClick={() => navigate('/login')} 
          style={styles.errorButton}
        >
          {t('login')}
        </button>
      </div>
    )
  }

  // Si no hay usuario pero tampoco error (caso raro)
  if (!user) {
    return (
      <div style={styles.errorContainer}>
        <p>{t('noUserDataReceived')}</p>
        <button onClick={() => navigate('/login')} style={styles.errorButton}>
          {t('login')}
        </button>
      </div>
    )
  }

  // Renderizar el dashboard normalmente
  return (
    <div style={styles.container} className="dashboard-container">
      {/* Header con información del usuario */}
      <div style={styles.header}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>
            {t('welcomeBack')}{user?.username !== 'admin' && user?.first_name ? `, ${user.first_name}` : ''}!
          </h1>
          <p style={styles.userRole}>
            {user?.rol === 'admin' && '⚙️ ' + t('administrator')}
            {user?.rol === 'doctor' && '👨‍⚕️ ' + t('doctor')}
            {user?.rol === 'nurse' && '👩‍⚕️ ' + t('nurse')}
            {user?.rol === 'patient' && '🩺 ' + t('patient')}
          </p>
          {/* ⬇️ NOTIFICACIONES AÑADIDAS AQUÍ (OPCIÓN 1) ⬇️ */}
          {noLeidas > 0 && (
            <div style={styles.notificacionBanner}>
              <span style={styles.notificacionIcon}>🔔</span>
              <span style={styles.notificacionTexto}>
                {t('unreadNotifications', { count: noLeidas })}
              </span>
            </div>
          )}
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <span style={styles.logoutIcon}>🚪</span>
          {t('logout')}
        </button>
      </div>
      
      {/* Contenido principal */}
      <div style={styles.content}>
        {/* Tarjeta de información del usuario */}
        <div style={styles.card} className="gradient-card pulse-card">
          <h3 style={styles.cardTitle}>
            <span style={styles.cardIcon}>📋</span>
            {t('personalInfo')}
          </h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('username')}:</span>
              <span style={styles.infoValue}>{user?.username || t('noDataAvailable')}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('firstName')}:</span>
              <span style={styles.infoValue}>
                {user?.first_name || ''} {user?.last_name || ''}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('email')}:</span>
              <span style={styles.infoValue}>{user?.email || t('noDataAvailable')}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>{t('phone')}:</span>
              <span style={styles.infoValue}>{user?.telefono || t('noDataAvailable')}</span>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div style={styles.statsCard} className="gradient-card pulse-card">
          <h3 style={styles.cardTitle}>
            <span style={styles.cardIcon}>📊</span>
            {t('quickStats')}
          </h3>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{stats.totalCitas}</div>
              <div style={styles.statLabel}>
                {user?.rol === 'patient' ? t('myAppointments') : t('totalAppointments')}
              </div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{stats.citasProximas}</div>
              <div style={styles.statLabel}>{t('upcomingAppointments')}</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{stats.especialidades}</div>
              <div style={styles.statLabel}>{t('specialties')}</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{stats.doctores}</div>
              <div style={styles.statLabel}>{t('doctors')}</div>
            </div>
          </div>
        </div>

        {/* Menú de navegación */}
        <div style={styles.menuCard}>
          <h3 style={styles.cardTitle}>
            <span style={styles.cardIcon}>📌</span>
            {t('mainMenu')}
          </h3>
          <div style={styles.menuGrid}>
            {/* Mis Citas - Visible para todos */}
            <div 
              style={styles.menuItem} 
              onClick={() => handleNavigation('/citas')}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleNavigation('/citas')}
            >
              <span style={styles.menuIcon}>📅</span>
              <span style={styles.menuLabel}>{t('myAppointments')}</span>
              <span style={styles.menuDescription}>{t('myAppointments')}</span>
            </div>

            {/* Doctores - Visible para todos */}
            <div 
              style={styles.menuItem} 
              onClick={() => handleNavigation('/doctores')}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleNavigation('/doctores')}
            >
              <span style={styles.menuIcon}>👨‍⚕️</span>
              <span style={styles.menuLabel}>{t('doctors')}</span>
              <span style={styles.menuDescription}>{t('seeSpecialists')}</span>
            </div>

            {/* {t('myProfile')} - Visible para todos */}
            <div 
              style={styles.menuItem} 
              onClick={() => handleNavigation('/perfil')}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleNavigation('/perfil')}
            >
              <span style={styles.menuIcon}>👤</span>
              <span style={styles.menuLabel}>{t('myProfile')}</span>
              <span style={styles.menuDescription}>{t('editProfile')}</span>
            </div>

            {/* Panel Admin - Solo visible para administradores */}
            {user?.rol === 'admin' && (
              <div 
                style={{...styles.menuItem, ...styles.adminMenuItem}} 
                onClick={() => handleNavigation('/admin')}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleNavigation('/admin')}
              >
                <span style={styles.menuIcon}>⚙️</span>
                <span style={styles.menuLabel}>{t('adminPanel')}</span>
                <span style={styles.menuDescription}>{t('manageSystem')}</span>
              </div>
            )}
          </div>
        </div>

        {/* ⬇️ NOTIFICACIONES AÑADIDAS AQUÍ (OPCIÓN 2 - dentro de la tarjeta de info) ⬇️ */}
        {noLeidas > 0 && (
          <div style={styles.notificacionCard}>
            <div style={styles.notificacionCardHeader}>
              <span style={styles.notificacionCardIcon}>🔔</span>
              <h3 style={styles.notificacionCardTitle}>{t('notifications')}</h3>
            </div>
            <p style={styles.notificacionCardText}>
              {t('unreadNotifications', { count: noLeidas })}
              {t('clickToSee')}
            </p>
            <div style={styles.notificacionCardActions}>
              <button 
                onClick={() => {
                  // Opcional: abrir el dropdown de notificaciones
                  // Esto requeriría una referencia al componente NotificacionesCampana
                  console.log('Abrir notificaciones');
                }}
                style={styles.notificacionCardButton}
              >
                {t('seeNotifications')}
              </button>
            </div>
          </div>
        )}

        {/* Recordatorios al final del dashboard para paciente, doctor y enfermería */}
        {(user?.rol === 'patient' || user?.rol === 'doctor' || user?.rol === 'nurse') && (
          <ReminderCards 
            citas={citasList} 
            user={user} 
            role={user?.rol === 'doctor' ? 'doctor' : user?.rol === 'nurse' ? 'nurse' : 'patient'} 
          />
        )}

        {user?.rol === 'nurse' && (
          <div style={styles.infoCard}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}>👩‍⚕️</span>
              {t('nursingDashboard')}
            </h3>
            <div style={styles.adminQuickLinks}>
              <button 
                onClick={() => handleNavigation('/enfermeria')}
                style={styles.quickLink}
              >
                👩‍⚕️ {t('goToNursingDashboard')}
              </button>
              <button 
                onClick={() => handleNavigation('/enfermeria?tab=pacientes')}
                style={styles.quickLink}
              >
                📋 {t('patientsToday')}
              </button>
              <button 
                onClick={() => handleNavigation('/enfermeria?tab=procedimientos')}
                style={styles.quickLink}
              >
                💉 {t('pendingProcedures')}
              </button>
            </div>
            <p style={styles.infoText}>
              {t('managePatientsInfo')}
            </p>
          </div>
        )}

        {user?.rol === 'admin' && (
          <div style={styles.infoCard}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}>📊</span>
              {t('quickAccessAdmin')}
            </h3>
            <div style={styles.adminQuickLinks}>
              <button 
                onClick={() => handleNavigation('/admin?tab=usuarios')}
                style={styles.quickLink}
              >
                👥 {t('manageUsers')}
              </button>
              <button 
                onClick={() => handleNavigation('/admin?tab=doctores')}
                style={styles.quickLink}
              >
                👨‍⚕️ {t('manageDoctors')}
              </button>
              <button 
                onClick={() => handleNavigation('/admin?tab=enfermeras')}
                style={styles.quickLink}
              >
                👩‍⚕️ {t('manageNurses')}
              </button>
              <button 
                onClick={() => handleNavigation('/admin?tab=citas')}
                style={styles.quickLink}
              >
                📅 {t('viewAllAppointments')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botón flotante del Asistente de citas — Solo para pacientes */}
      {user?.rol === 'patient' && (
        <>
          <button
            onClick={() => setMostrarChatIA(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '70px',
              height: '60px',
              borderRadius: '30px',
              background: 'var(--role-gradient)',
              border: 'none',
              boxShadow: '0 4px 20px var(--shadow-color-hover)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              zIndex: 999,
              flexDirection: 'column',
              gap: '2px'
            }}
            title={t('chatAssistant')}
          >
            <span style={{ fontSize: '24px' }}>🤖</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Chat</span>
          </button>

          {mostrarChatIA && (
            <ChatIA
              onClose={() => setMostrarChatIA(false)}
            />
          )}
        </>
      )}
    </div>
  )
}

// Estilos 
const styles = {
  // ============================================
  // CONTENEDORES PRINCIPALES
  // ============================================
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-primary)',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  },

  // ============================================
  // LOADING (PANTALLA DE CARGA)
  // ============================================
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)'
  },
  loadingSpinner: {
    fontSize: '48px',
    color: 'var(--color-patient)',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  loadingText: {
    fontSize: '18px',
    color: 'var(--text-primary)',
    marginBottom: '5px'
  },
  loadingSubtext: {
    fontSize: '14px',
    color: 'var(--text-muted)'
  },

  // ============================================
  // ERROR (PANTALLA DE ERROR)
  // ============================================
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    padding: '20px',
    textAlign: 'center'
  },
  errorIcon: {
    fontSize: '48px',
    color: '#e74c3c',
    marginBottom: '20px'
  },
  errorTitle: {
    fontSize: '24px',
    color: 'var(--text-primary)',
    marginBottom: '10px'
  },
  errorMessage: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    marginBottom: '30px',
    maxWidth: '400px'
  },
  errorButton: {
    backgroundColor: 'var(--color-patient)',
    color: 'white',
    padding: '12px 30px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  retryButton: {
    backgroundColor: 'var(--color-patient)',
    color: 'white',
    padding: '12px 30px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '10px'
  },

  // ============================================
  // HEADER (CABECERA DEL DASHBOARD)
  // ============================================
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    backgroundColor: 'var(--bg-secondary)',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  welcomeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  welcomeTitle: {
    fontSize: '24px',
    color: 'var(--text-primary)',
    margin: 0
  },
  userRole: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  logoutButton: {
    backgroundColor: 'var(--color-cancelled)',
    color: 'white',
    padding: '12px 25px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoutIcon: {
    fontSize: '18px'
  },

  // ============================================
  // TARJETAS (CARD) GENÉRICAS
  // ============================================
  card: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  menuCard: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  infoCard: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '25px',
    borderRadius: '15px',
    border: '1px solid var(--border-color)'
  },
  cardTitle: {
    fontSize: '20px',
    color: 'var(--text-primary)',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  cardIcon: {
    fontSize: '24px',
    color: 'var(--color-patient)'
  },

  // ============================================
  // INFORMACIÓN DE USUARIO (GRID)
  // ============================================
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  infoLabel: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoValue: {
    fontSize: '16px',
    color: 'var(--text-primary)',
    fontWeight: '500'
  },

  // ============================================
  // MENÚ DE NAVEGACIÓN (GRID DE OPCIONES)
  // ============================================
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
  },
  menuItem: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '20px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    color: 'var(--text-primary)',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--box-shadow-hover)'
    }
  },
  adminMenuItem: {
    borderLeft: '4px solid var(--color-admin)'
  },
  menuIcon: {
    fontSize: '32px',
    color: 'var(--color-patient)',
    marginBottom: '5px'
  },
  menuLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  menuDescription: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4'
  },

  // ============================================
  // ENLACES RÁPIDOS (ADMIN)
  // ============================================
  adminQuickLinks: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
    marginTop: '15px'
  },
  quickLink: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    padding: '12px 20px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: 'var(--color-admin)',
      color: 'white',
      borderColor: 'var(--color-admin)'
    }
  },

  // ============================================
  // TEXTO INFORMATIVO
  // ============================================
  infoText: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    margin: 0
  },

  // ============================================
  // NOTIFICACIONES (BANNER)
  // ============================================
  notificacionBanner: {
    backgroundColor: 'var(--color-admin)',
    color: 'white',
    padding: '8px 15px',
    borderRadius: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '10px',
    fontSize: '14px'
  },
  notificacionIcon: {
    fontSize: '16px'
  },
  notificacionTexto: {
    color: 'white'
  },

  // ============================================
  // NOTIFICACIONES (TARJETA)
  // ============================================
  notificacionCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--color-admin)',
    borderRadius: '10px',
    padding: '15px',
    marginTop: '10px'
  },
  notificacionCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  notificacionCardIcon: {
    fontSize: '24px'
  },
  notificacionCardTitle: {
    margin: 0,
    fontSize: '16px',
    color: 'var(--text-primary)'
  },
  notificacionCardText: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  notificacionCardActions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  notificacionCardButton: {
    backgroundColor: 'var(--color-admin)',
    color: 'white',
    padding: '8px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: 'var(--color-admin-soft)',
      transform: 'translateY(-2px)'
    }
  },

  // ============================================
  // ESTADÍSTICAS (STATS)
  // ============================================
  statsCard: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statItem: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'all 0.3s'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--color-patient)',
    margin: 0
  },
  statLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0
  }
}

// Añadir animación de spin para el loader
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(styleSheet)

export default Dashboard
