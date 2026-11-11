import React, { useState } from 'react'
// use the shared axios instance for auth and token handling
import axiosInstance from '../services/auth'
import { useNavigate, Link } from 'react-router-dom'
import { 
  FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash,
  FaCheckCircle, FaExclamationTriangle, FaSpinner, FaUserPlus
} from 'react-icons/fa'
import { APP_NAME } from '../config/constants'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import LegalModal from './legal/LegalModal'

function Registro() {
  const { t } = useLanguage()
  const { cargarUsuario } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    telefono: '',
    rol: 'patient'  // Por defecto paciente
  })
  
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: '#e74c3c' })
  // Evitar que el componente se desmonte durante el registro
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const navigate = useNavigate()

  // Validar fortaleza de contraseña
  const validatePasswordStrength = (password) => {
    let score = 0
    let message = ''
    let color = '#95a5a6'

    if (password.length >= 4) score += 1
    if (password.length >= 6) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    if (password.length === 0) {
      message = t('passwordEmpty')
      color = '#95a5a6'
    } else if (score <= 2) {
      message = t('passwordWeak')
      color = '#e74c3c'
    } else if (score <= 3) {
      message = t('passwordMedium')
      color = '#f39c12'
    } else if (score <= 4) {
      message = t('passwordStrong')
      color = '#27ae60'
    } else {
      message = t('passwordVeryStrong')
      color = '#27ae60'
    }

    setPasswordStrength({ score, message, color })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar error del campo específico
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Validar fortaleza de contraseña
    if (name === 'password') {
      validatePasswordStrength(value)
    }

    // Limpiar error general
    if (error) setError('')
  }

  const validateForm = () => {
    const newErrors = {}

    // Validar username
    if (!formData.username.trim()) {
      newErrors.username = t('usernameRequired')
    } else if (formData.username.length < 3) {
      newErrors.username = t('usernameTooShort')
    }

    // Validar senha
    if (!formData.password) {
      newErrors.password = t('passwordRequired')
    } else if (formData.password.length < 4) {
      newErrors.password = t('passwordTooShort')
    }

    // Validar nombre
    if (!formData.first_name.trim()) {
      newErrors.first_name = t('firstNameRequired')
    }

    // Validar apellido
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('lastNameRequired')
    }

    // Validar email (opcional para pacientes, obligatorio para otros roles)
    if (formData.rol !== 'patient' && !formData.email.trim()) {
      newErrors.email = t('emailRequired')
    } else if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('invalidEmail')
    }

    // Validar teléfono (opcional pero con formato)
    if (formData.telefono && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.telefono)) {
      newErrors.telefono = t('invalidPhone')
    }

    if (!aceptaTerminos) {
      newErrors.acepta_terminos = t('acceptTermsRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevenir múltiples envíos
    if (isSubmitting || loading) {
      return
    }
    
    // Validar formulario
    if (!validateForm()) {
      setError(t('fixFormErrors'))
      return
    }

    setIsSubmitting(true)
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Configurar timeout más largo (60s) para evitar cancelaciones
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      // usar axiosInstance para respetar la configuración común
      const response = await axiosInstance.post(
        'registro/', 
        { ...formData, acepta_terminos: aceptaTerminos },
        {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000  // timeout adicional de axios
        }
      )

      clearTimeout(timeoutId)

      
      setSuccess(t('registrationSuccess'))
      
      // Salvar tokens y cargar usuario en el contexto si el registro retornó tokens
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access)
        localStorage.setItem('refresh_token', response.data.refresh)
        
        // Cargar usuario en el AuthContext para establecer la sesión
        try {
          await cargarUsuario()
          setSuccess(t('registrationSuccess'))
          // Redirigir al dashboard del paciente con sesión iniciada
          setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
        } catch (error) {
          console.error('Error al cargar usuario después del registro:', error)
          // Si falla la carga del usuario, mostrar mensaje y redirigir al login
          setError(t('errorLoadingUser'))
          setTimeout(() => navigate('/login', { replace: true }), 2000)
        } finally {
          setLoading(false)
        }
      } else {
        // Si no hay tokens, mostrar mensaje informativo y redirigir al login
        setSuccess(t('registrationSuccess') + '. ' + t('pleaseLogin'))
        setTimeout(() => navigate('/login'), 2000)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error detallado:', err)

      // Axios produces different error shapes for cancellations/timeouts.
      if (err?.name === 'AbortError' || err?.name === 'CanceledError' || err?.code === 'ECONNABORTED' || err?.code === 'ERR_CANCELED') {
        setError(t('connectionTimeout'))
      } else if (err.response) {
        // Errores del servidor
        console.error('Error response:', err.response.data)
        
        if (err.response.status === 400) {
          // Errores de validación del backend
          const backendErrors = err.response.data
          
          if (typeof backendErrors === 'object') {
            // Mostrar erros especificos do backend
            const errorMessages = []
            Object.entries(backendErrors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                errorMessages.push(`${field}: ${messages.join(', ')}`)
                // Marcar el campo con error
                setErrors(prev => ({
                  ...prev,
                  [field]: messages[0]
                }))
              }
            })
            
            if (errorMessages.length > 0) {
              setError(errorMessages.join('\n'))
            } else {
              setError(t('invalidData'))
            }
          } else {
            setError(backendErrors.message || t('registrationError'))
          }
        } else if (err.response.status === 409) {
          setError(t('usernameExists'))
          setErrors(prev => ({
            ...prev,
            username: t('userAlreadyRegistered')
          }))
        } else {
          setError(`${t('serverError')}: ${err.response.status}`)
        }
      } else if (err.request) {
        setError(t('cannotConnectServer'))
      } else {
        setError(t('errorConnectingServer'))
      }
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  const handleDemoData = () => {
    setFormData({
      username: 'paciente_demo',
      password: 'Demo123!',
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'juan.perez@email.com',
      telefono: '+244 923 456 789',
      rol: 'patient'
    })
    validatePasswordStrength('Demo123!')
  }

  const handleTermsChange = (event) => {
    const accepted = event.target.checked
    setAceptaTerminos(accepted)
    if (accepted) {
      setErrors((previous) => ({ ...previous, acepta_terminos: '' }))
    }
    if (error) setError('')
  }

  const handleOpenLegal = () => {
    setShowLegalModal(true)
    if (error) setError('')
  }

  const handleAcceptLegal = () => {
    setAceptaTerminos(true)
    setErrors((previous) => ({ ...previous, acepta_terminos: '' }))
    setShowLegalModal(false)
  }

  return (
    <div style={styles.container} className="fade-in-scale slide-in-top">
      <div style={styles.card}>
        {/* Logo y título */}
        <div style={styles.header}>
          <FaUserPlus style={styles.headerIcon} />
          <h1 style={styles.title}>{APP_NAME}</h1>
          <p style={styles.subtitle}>{t('createAccount')}</p>
        </div>

        {/* Mensajes */}
        {error && (
          <div style={styles.errorContainer}>
            <FaExclamationTriangle style={styles.messageIcon} />
            <div style={styles.errorText}>{error}</div>
          </div>
        )}

        {success && (
          <div style={styles.successContainer}>
            <FaCheckCircle style={styles.messageIcon} />
            <div style={styles.successText}>{success}</div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Nombre y Apellido en fila */}
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label htmlFor="register-first-name" style={styles.label}>
                <FaUser style={styles.inputIcon} />
                {t('firstName')} *
              </label>
              <input
                type="text"
                id="register-first-name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.first_name ? styles.inputError : {})
                }}
                placeholder={t('namePlaceholder')}
                disabled={loading}
                maxLength="50"
              />
              {errors.first_name && (
                <span style={styles.fieldError}>{errors.first_name}</span>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="register-last-name" style={styles.label}>
                <FaUser style={styles.inputIcon} />
                {t('lastName')} *
              </label>
              <input
                type="text"
                id="register-last-name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.last_name ? styles.inputError : {})
                }}
                placeholder={t('lastNamePlaceholder')}
                disabled={loading}
                maxLength="50"
              />
              {errors.last_name && (
                <span style={styles.fieldError}>{errors.last_name}</span>
              )}
            </div>
          </div>

          {/* Usuario */}
          <div style={styles.inputGroup}>
            <label htmlFor="register-username" style={styles.label}>
              <FaUser style={styles.inputIcon} />
              {t('username')} *
            </label>
            <input
              type="text"
              id="register-username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.username ? styles.inputError : {})
              }}
              placeholder={t('usernamePlaceholder')}
              disabled={loading}
              maxLength="30"
              autoComplete="username"
            />
            {errors.username && (
              <span style={styles.fieldError}>{errors.username}</span>
            )}
            <span style={styles.inputHint}>{t('minimum3Characters')}</span>
          </div>

          {/* Email */}
          <div style={styles.inputGroup}>
            <label htmlFor="register-email" style={styles.label}>
              <FaEnvelope style={styles.inputIcon} />
              Email {t('requiredFieldIndicator')}
            </label>
              <input
                type="email"
                id="register-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.email ? styles.inputError : {})
                }}
                placeholder="correo@ejemplo.com"
                disabled={loading}
                autoComplete="email"
              />
            {errors.email && (
              <span style={styles.fieldError}>{errors.email}</span>
            )}
          </div>

          {/* Teléfono */}
          <div style={styles.inputGroup}>
            <label htmlFor="register-phone" style={styles.label}>
              <FaPhone style={styles.inputIcon} />
              {t('phone')}
            </label>
              <input
                type="tel"
                id="register-phone"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.telefono ? styles.inputError : {})
                }}
                placeholder="+244 XXX XXX XXX"
                disabled={loading}
                autoComplete="tel"
              />
            {errors.telefono && (
              <span style={styles.fieldError}>{errors.telefono}</span>
            )}
            <span style={styles.inputHint}>Formato: +244 923 456 789</span>
          </div>

          {/* Contraseña */}
          <div style={styles.inputGroup}>
            <label htmlFor="register-password" style={styles.label}>
              <FaLock style={styles.inputIcon} />
              {t('passwordLabel')}
            </label>
            <div style={styles.passwordWrapper}>
                <input
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  ...styles.passwordInput,
                  ...(errors.password ? styles.inputError : {})
                }}
                placeholder="••••••••"
                disabled={loading}
                maxLength="50"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <span style={styles.fieldError}>{errors.password}</span>
            )}
            
            {/* Indicador de fortaleza de contraseña */}
            {formData.password && (
              <div style={styles.strengthContainer}>
                <div style={styles.strengthBar}>
                  <div style={{
                    ...styles.strengthFill,
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.color
                  }} />
                </div>
                <span style={{...styles.strengthText, color: passwordStrength.color}}>
                  {passwordStrength.message}
                </span>
              </div>
            )}
            
            <span style={styles.inputHint}>{t('minimum4Characters')}</span>
          </div>

          {/* Rol (fijo como patient, oculto) */}
          <input type="hidden" name="rol" value="patient" />

          <div style={styles.termsAcceptance}>
            <label
              style={styles.termsAcceptanceLabel}
              htmlFor="accept-legal"
              onClick={handleOpenLegal}
            >
              <input
                id="accept-legal"
                name="acepta_terminos"
                type="checkbox"
                checked={aceptaTerminos}
                onChange={handleTermsChange}
                required
                disabled={loading}
                aria-invalid={Boolean(errors.acepta_terminos)}
                aria-describedby={errors.acepta_terminos ? 'accept-legal-error' : undefined}
              />
              <span style={{ cursor: 'pointer' }} onClick={handleOpenLegal}>
                {t('aceptaTerminosPrefix')}{' '}
                <span
                  style={styles.termsLink}
                  onClick={(e) => { e.stopPropagation(); handleOpenLegal() }}
                >
                  {t('termsLink')}
                </span>{' '}
                {t('and')}{' '}
                <span
                  style={styles.termsLink}
                  onClick={(e) => { e.stopPropagation(); handleOpenLegal() }}
                >
                  {t('privacyLink')}
                </span>.
              </span>
            </label>
            {errors.acepta_terminos && (
              <span id="accept-legal-error" role="alert" style={styles.fieldError}>
                {errors.acepta_terminos}
              </span>
            )}
          </div>

          <LegalModal
            isOpen={showLegalModal}
            onClose={() => setShowLegalModal(false)}
            onAccept={handleAcceptLegal}
          />

          {/* Botón de registro */}
          <button 
            type="submit" 
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
            disabled={!aceptaTerminos || loading}
          >
            {loading ? (
              <>
                <FaSpinner style={styles.spinner} />
                {t('registering')}
              </>
            ) : (
              <>
                <FaUserPlus />
                {t('createAccount')}
              </>
            )}
          </button>

          {/* Botón de demo (solo desarrollo) */}
          {import.meta.env.DEV && !loading && (
            <button 
              type="button"
              onClick={handleDemoData}
              style={styles.demoButton}
            >
              🚀 {t('loadDemoData')}
            </button>
          )}
        </form>

        {/* Enlace a login */}
        <div style={styles.loginContainer}>
          <p style={styles.loginText}>
            {t('hasAccount')}{' '}
            <Link to="/login" style={styles.loginLink}>
              {t('loginHere')}
            </Link>
          </p>
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
    minHeight: 'var(--app-viewport-min-height, 100vh)',
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
    maxWidth: '500px',
    border: '1px solid var(--border-color)',
    transition: 'transform 0.3s'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  headerIcon: {
    fontSize: '48px',
    color: 'var(--color-patient)',
    marginBottom: '10px'
  },
  title: {
    color: 'var(--text-primary)',
    fontSize: '28px',
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
    padding: '15px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  successContainer: {
    backgroundColor: 'var(--color-success-bg)',
    border: '1px solid var(--color-success)',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  messageIcon: {
    fontSize: '20px',
    flexShrink: 0
  },
  errorText: {
    color: '#721c24',
    fontSize: '14px',
    whiteSpace: 'pre-line',
    flex: 1
  },
  successText: {
    color: '#155724',
    fontSize: '14px',
    flex: 1
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  inputIcon: {
    fontSize: '12px',
    color: 'var(--text-muted)'
  },
  input: {
    padding: '12px',
    border: '2px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.3s',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    ':focus': {
      borderColor: 'var(--color-patient)'
    },
    ':disabled': {
      backgroundColor: 'var(--bg-tertiary)',
      cursor: 'not-allowed'
    }
  },
  inputError: {
    borderColor: '#e74c3c'
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  passwordInput: {
    flex: 1,
    padding: '12px',
    paddingRight: '40px',
    border: '2px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.3s',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    ':focus': {
      borderColor: 'var(--color-patient)'
    }
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '0',
    width: '48px',
    minWidth: '48px',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      color: 'var(--text-primary)'
    }
  },
  fieldError: {
    color: '#e74c3c',
    fontSize: '12px',
    marginTop: '3px'
  },
  inputHint: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  strengthContainer: {
    marginTop: '8px'
  },
  strengthBar: {
    height: '4px',
    backgroundColor: 'var(--border-color)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '4px'
  },
  strengthFill: {
    height: '100%',
    transition: 'width 0.3s, background-color 0.3s'
  },
  strengthText: {
    fontSize: '11px',
    fontWeight: '500'
  },
  submitButton: {
    backgroundColor: 'var(--color-patient)',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s',
    marginTop: '10px',
    ':hover': {
      opacity: 0.9,
      transform: 'translateY(-2px)'
    }
  },
  submitButtonDisabled: {
    backgroundColor: 'var(--text-muted)',
    cursor: 'not-allowed',
    ':hover': {
      backgroundColor: 'var(--text-muted)',
      transform: 'none'
    }
  },
  demoButton: {
    backgroundColor: 'var(--color-admin)',
    color: 'white',
    padding: '12px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: 'var(--color-admin-soft)'
    }
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  loginContainer: {
    marginTop: '25px',
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)'
  },
  loginText: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    margin: 0
  },
  loginLink: {
    color: 'var(--color-patient)',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '48px',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  termsAcceptance: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    lineHeight: 1.5
  },
  termsAcceptanceLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    cursor: 'pointer',
    minHeight: '48px'
  },
  termsLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
      color: 'var(--color-patient)'
    }
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

export default Registro