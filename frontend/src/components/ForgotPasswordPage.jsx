import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { requestPasswordReset } from '../services/auth'
import { APP_NAME } from '../config/constants'

function ForgotPasswordPage() {
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { value } = e.target
    setEmail(value.trim().toLowerCase())
    if (error) setError('')
    if (success) setSuccess('')
  }

  const validateForm = () => {
    if (!email) {
      setError(t('emailRequired') || 'El correo electrónico es obligatorio')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t('emailInvalid') || 'Ingresa un correo electrónico válido')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await requestPasswordReset(email)
        // Respuesta genérica: nunca revelar si el email existe
      setSuccess(
        t('forgotPasswordSuccess') ||
        'Si el correo está registrado, recibirás un enlace de recuperación.'
      )
    } catch (err) {
      console.error('Error en solicitud de recuperación:', err)
      setError(
        err.message ||
        t('serverConnectionError') ||
        'No se pudo procesar la solicitud. Inténtalo de nuevo.'
      )
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

        {success && (
          <div style={styles.successContainer}>
            <span style={styles.successIcon}>✅</span>
            <span style={styles.successText}>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="forgot-email">
              {t('forgotPasswordEmailLabel') || 'Correo electrónico'}
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📧</span>
              <input
                id="forgot-email"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                style={styles.input}
                placeholder={t('forgotPasswordEmailPlaceholder') || 'tu@correo.com'}
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? t('loggingIn') || 'Enviando...' : t('forgotPasswordSendButton') || 'Enviar enlace de recuperación'}
          </button>
        </form>

        <div style={styles.registerContainer}>
          <p style={styles.registerText}>
            {t('hasAccount') || 'Ya tienes una cuenta?'}{' '}
            <Link to="/login" style={styles.registerLink}>
              {t('loginHere') || 'Inicia sesión'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: 'var(--box-shadow)',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid var(--border-color)',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    color: 'var(--text-primary)',
    fontSize: '32px',
    margin: '0 0 5px 0',
    fontWeight: '700',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    margin: 0,
  },
  errorContainer: {
    backgroundColor: 'var(--color-error-bg)',
    border: '1px solid var(--color-error)',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  errorIcon: {
    fontSize: '20px',
  },
  errorText: {
    color: '#721c24',
    fontSize: '14px',
  },
  successContainer: {
    backgroundColor: '#e7f4f2',
    border: '1px solid #1abba9',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  successIcon: {
    fontSize: '20px',
  },
  successText: {
    color: '#059669',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '16px',
    color: 'var(--text-muted)',
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
    transition: 'border-color 0.3s',
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
    transition: 'all 0.3s',
  },
  buttonDisabled: {
    backgroundColor: 'var(--text-muted)',
    cursor: 'not-allowed',
  },
  registerContainer: {
    marginTop: '25px',
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
  },
  registerText: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    margin: 0,
  },
  registerLink: {
    color: 'var(--color-patient)',
    textDecoration: 'none',
    fontWeight: '600',
  },
}

export default ForgotPasswordPage
