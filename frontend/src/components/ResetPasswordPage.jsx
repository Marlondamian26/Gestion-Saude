import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { confirmPasswordReset } from '../services/auth'
import { APP_NAME } from '../config/constants'

function ResetPasswordPage() {
  const { t } = useLanguage()
  const { token } = useParams()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenValidado, setTokenValidado] = useState(false)

  useEffect(() => {
    if (token) {
      setTokenValidado(true)
    }
  }, [token])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'new_password') {
      setNewPassword(value)
    } else if (name === 'confirm_password') {
      setConfirmPassword(value)
    }
    if (error) setError('')
    if (success) setSuccess('')
  }

  const validateForm = () => {
    if (!newPassword) {
      setError(t('passwordRequired') || 'La nueva contraseña es obligatoria')
      return false
    }
    if (newPassword.length < 8) {
      setError(t('minimum8Characters') || 'La contraseña debe tener al menos 8 caracteres')
      return false
    }
    if (!confirmPassword) {
      setError(t('confirmPasswordRequired') || 'Confirma la nueva contraseña')
      return false
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch') || 'Las contraseñas no coinciden')
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
      if (!token) {
        throw new Error(t('tokenMissing') || 'Token de recuperación no proporcionado.')
      }
      await confirmPasswordReset(token, newPassword)
      setSuccess(
        t('resetPasswordSuccess') ||
        'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'
      )
    } catch (err) {
      console.error('Error al restablecer contraseña:', err)
      setError(
        err.message ||
        t('serverConnectionError') ||
        'No se pudo actualizar la contraseña. Inténtalo de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!tokenValidado) {
    return (
      <div style={styles.container} className="fade-in-up slide-in-bottom">
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <h1 style={styles.title}>{APP_NAME}</h1>
            <p style={styles.subtitle}>{t('appSlogan')}</p>
          </div>
          <div style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorText}>
              {t('invalidResetLink') || 'Enlace de restablecimiento no válido.'}
            </span>
          </div>
          <p style={styles.registerText}>
            {t('resetPasswordBackToLogin') || 'Volver a '}{' '}
            <Link to="/login" style={styles.registerLink}>
              {t('loginHere') || 'inicio de sesión'}
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container} className="fade-in-up slide-in-bottom">
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <h1 style={styles.title}>{t('resetPasswordTitle') || 'Nueva contraseña'}</h1>
          <p style={styles.subtitle}>{t('resetPasswordSubtitle') || 'Crea una nueva contraseña para tu cuenta.'}</p>
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

        {!success && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="reset-new-password">
                {t('resetPasswordNewPasswordLabel') || 'Nueva contraseña'}
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  id="reset-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  name="new_password"
                  value={newPassword}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder={t('resetPasswordNewPasswordPlaceholder') || 'Mínimo 8 caracteres'}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={styles.passwordToggle}
                >
                  {showNewPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="reset-confirm-password">
                {t('resetPasswordConfirmPasswordLabel') || 'Confirmar nueva contraseña'}
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={confirmPassword}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder={t('resetPasswordConfirmPasswordPlaceholder') || 'Repite la nueva contraseña'}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
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
              {loading ? t('loggingIn') || 'Actualizando...' : t('resetPasswordUpdateButton') || 'Actualizar contraseña'}
            </button>
          </form>
        )}

        {success && (
          <div style={styles.registerContainer}>
            <p style={styles.registerText}>
              {t('resetPasswordBackToLogin') || '¿Ya recuerdas tu contraseña? '}{' '}
              <Link to="/login" style={styles.registerLink}>
                {t('loginHere') || 'Inicia sesión'}
              </Link>
            </p>
          </div>
        )}
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
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
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

export default ResetPasswordPage
