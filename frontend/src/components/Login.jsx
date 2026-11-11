import React, { useState, useEffect } from 'react'
// reuse the preconfigured axios instance for consistency
import axiosInstance from '../services/auth'
import { useNavigate, Link } from 'react-router-dom'
import { APP_NAME, PRIVACY_URL, TERMS_URL } from '../config/constants'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

function Login() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  // Verificar si ya hay sesión activa solo al montar
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token && !loading) {
      navigate('/dashboard')
    }
  }, [navigate])

  // ===== FUNCIÓN DE DEMO =====
  // El demo ahora usa el endpoint especial del backend
  // Las credenciales se configuran en el backend via variables de entorno
  // En el frontend, permitimos configurar via variables de entorno también
  const DEMO_USERNAME = import.meta?.env?.VITE_DEMO_USERNAME || 'demo_patient';
  const DEMO_PASSWORD = import.meta?.env?.VITE_DEMO_PASSWORD || 'demo1234';

  const handleDemoAccess = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Intentar login con credenciales de demo
      // Estas credenciales deben estar configuradas en el backend
      // Si no están configuradas, el login fallará
      await login(DEMO_USERNAME, DEMO_PASSWORD)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Error en demo:', err)
      if (err.response?.status === 401) {
        setError(t('demoNotAvailable'))
      } else if (err.response?.status === 403) {
        setError(t('demoNoAccess'))
      } else {
        setError(t('serverConnectionError'))
      }
    } finally {
      setLoading(false)
    }
  }
  // ==========================

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError(t('usernameRequiredField'))
      return false
    }
    if (!formData.password.trim()) {
      setError(t('passwordRequiredField'))
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      await login(formData.username, formData.password)
      
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true')
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Error:', err)
      if (err.response?.status === 401) {
        setError(t('invalidCredentials'))
      } else {
        setError(t('connectionError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container} className="fade-in-up slide-in-bottom">
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <h1 style={styles.title}>{APP_NAME}</h1>
          <p style={styles.subtitle}>{t('appSlogan')}</p>
        </div>

        {error && (
          <div style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('username')}</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
                <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={styles.input}
                placeholder={t('usernameOrEmail')}
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('password')}</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
                placeholder={t('enterPassword')}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              {t('rememberMe')}
            </label>
            <Link to="/forgot-password" style={styles.forgotPasswordLink}>
              {t('forgotPassword') || '¿Olvidaste tu contraseña?'}
            </Link>
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? t('loggingIn') : t('login')}
          </button>
        </form>

        <div style={styles.registerContainer}>
          <p style={styles.registerText}>
            {t('noAccount')}{' '}
            <Link to="/registro" style={styles.registerLink}>
              {t('registerHere')}
            </Link>
          </p>
          <nav aria-label={t('legalLinksAria')} style={styles.legalLinks}>
            <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" style={styles.legalLink}>
              {t('termsLink')}
            </a>
            <span aria-hidden="true"> · </span>
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" style={styles.legalLink}>
              {t('privacyLink')}
            </a>
          </nav>
        </div>
      </div>
    </div>
  )
}

// Estilos 
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: 'var(--box-shadow)',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid var(--border-color)'
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    color: 'var(--text-primary)',
    fontSize: '32px',
    margin: '0 0 5px 0',
    fontWeight: '700'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    margin: 0
  },
  errorContainer: {
    backgroundColor: 'var(--color-error-bg)',
    border: '1px solid var(--color-error)',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  errorIcon: {
    fontSize: '20px'
  },
  errorText: {
    color: '#721c24',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: '600'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '16px',
    color: 'var(--text-muted)'
  },
  input: {
    width: '100%',
    padding: '12px 40px',
    fontSize: '16px',
    border: `2px solid var(--border-color)`,
    borderRadius: '10px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: 'var(--text-secondary)',
    cursor: 'pointer'
  },
  button: {
    backgroundColor: 'var(--color-patient)',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'all 0.3s'
  },
  buttonDisabled: {
    backgroundColor: 'var(--text-muted)',
    cursor: 'not-allowed'
  },
  demoButton: {
    backgroundColor: 'var(--color-admin)',
    color: 'white',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '5px',
    transition: 'all 0.3s'
  },
  demoButtonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  demoIcon: {
    fontSize: '18px'
  },
  registerContainer: {
    marginTop: '25px',
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)'
  },
  registerText: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    margin: 0
  },
  registerLink: {
    color: 'var(--color-patient)',
    textDecoration: 'none',
    fontWeight: '600'
  },
  forgotPasswordLink: {
    color: 'var(--color-patient)',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
    marginLeft: 'auto',
    cursor: 'pointer',
  },
  legalLinks: {
    marginTop: '14px',
    fontSize: '12px'
  },
  legalLink: {
    color: 'var(--text-muted)',
    textDecoration: 'underline'
  }
}

export default Login