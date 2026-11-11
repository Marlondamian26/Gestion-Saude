import React, { useEffect, useRef, useState } from 'react'
import axiosInstance from '../services/auth'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { 
  FaUser, FaEnvelope, FaPhone, FaAllergies, FaTint, 
  FaUserMd, FaHistory, FaEdit, FaKey, FaSave, FaTimes,
  FaBirthdayCake, FaVenusMars, FaAddressCard, FaHeart,
  FaExclamationTriangle, FaCheckCircle, FaSpinner, FaClipboardList
} from 'react-icons/fa'

function Perfil() {
  const { t } = useLanguage()
  const [user, setUser] = useState(null)
  const [paciente, setPaciente] = useState(null)
  const [doctor, setDoctor] = useState(null)
  const [enfermera, setEnfermera] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState(t('loadingProfile'))
  const [editMode, setEditMode] = useState(false)
  const [changePasswordMode, setChangePasswordMode] = useState(false)
  const [historialCitas, setHistorialCitas] = useState([])
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  // Estados para edición
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telefono: '',
    alergias: '',
    grupo_sanguineo: '',
    contacto_emergencia: '',
    telefono_emergencia: '',
    // Para doctors y enfermeras
    especialidad: '',
    otra_especialidad: '',
    biografia: '',
    numero_licencia: ''
  })

  // Estado para foto de perfil
  const [fotoPerfil, setFotoPerfil] = useState(null)
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(null)
  const fotoPerfilPreviewRef = useRef(null)

  useEffect(() => {
    return () => {
      if (fotoPerfilPreviewRef.current) {
        URL.revokeObjectURL(fotoPerfilPreviewRef.current)
      }
    }
  }, [])

  const handleFotoPerfilChange = (e) => {
    const file = e.target.files?.[0] || null

    if (fotoPerfilPreviewRef.current) {
      URL.revokeObjectURL(fotoPerfilPreviewRef.current)
    }

    const previewUrl = file ? URL.createObjectURL(file) : null
    fotoPerfilPreviewRef.current = previewUrl
    setFotoPerfil(file)
    setFotoPerfilPreview(previewUrl)
  }

  const limpiarFotoPerfilSeleccionada = () => {
    if (fotoPerfilPreviewRef.current) {
      URL.revokeObjectURL(fotoPerfilPreviewRef.current)
      fotoPerfilPreviewRef.current = null
    }

    setFotoPerfil(null)
    setFotoPerfilPreview(null)
  }

  // Estado para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Estado para validación de contraseña
  const [passwordErrors, setPasswordErrors] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setLoading(true)
    setLoadingMessage(t('loadingYourInfo'))
    
    try {
      // Verificar token primero
      const token = localStorage.getItem('access_token')
      if (!token) {
        console.log('No hay token, redirigiendo a login')
        navigate('/login')
        return
      }

      // Obtener usuario actual
      setLoadingMessage(t('loadingYourInfo'))
      const userResponse = await axiosInstance.get('usuario-actual/')
      
      if (!userResponse.data) {
        throw new Error(t('noUserDataReceived'))
      }

      console.log('Usuario cargado:', userResponse.data)
      setUser(userResponse.data)
      
      setEditForm({
        first_name: userResponse.data.first_name || '',
        last_name: userResponse.data.last_name || '',
        email: userResponse.data.email || '',
        telefono: userResponse.data.telefono || '',
        alergias: '',
        grupo_sanguineo: '',
        contacto_emergencia: '',
        telefono_emergencia: ''
      })

      // Cargar datos según el rol
      if (userResponse.data.rol === 'patient') {
        await cargarDatosPaciente(userResponse.data.id)
      } else if (userResponse.data.rol === 'doctor') {
        await cargarDatosDoctor(userResponse.data.id)
      } else if (userResponse.data.rol === 'nurse') {
        await cargarDatosEnfermera(userResponse.data.id)
      }

      // Cargar historial de citas para todos
      await cargarHistorialCitas()

    } catch (error) {
      console.error('Error detallado cargando perfil:', error)
      
      if (error.response) {
        if (error.response.status === 401) {
          mostrarMensaje(t('sessionExpired'), 'error')
          setTimeout(() => navigate('/login'), 2000)
        } else {
          mostrarMensaje(t('serverError') + ': ' + error.response.status, 'error')
        }
      } else if (error.request) {
        mostrarMensaje('No se pudo conectar con el servidor', 'error')
      } else {
        mostrarMensaje('Error al cargar el perfil: ' + error.message, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const cargarDatosPaciente = async (usuarioId) => {
    setLoadingMessage(t('loadingMedicalInfo'))
    
    const pacientesResponse = await axiosInstance.get('pacientes/')
    const pacientesData = Array.isArray(pacientesResponse.data) ? pacientesResponse.data : []
    const miPaciente = pacientesData.find(p => p.usuario?.id === usuarioId)
    
    if (miPaciente) {
      console.log('Perfil de paciente cargado:', miPaciente)
      setPaciente(miPaciente)
      setEditForm(prev => ({
        ...prev,
        alergias: miPaciente.alergias || '',
        grupo_sanguineo: miPaciente.grupo_sanguineo || '',
        contacto_emergencia: miPaciente.contacto_emergencia || '',
        telefono_emergencia: miPaciente.telefono_emergencia || ''
      }))
    }
  }

  const cargarDatosDoctor = async (usuarioId) => {
    setLoadingMessage(t('loadingProfessionalInfo'))
    
    try {
      const doctorResponse = await axiosInstance.get('mi-perfil-doctor/')
      console.log('Perfil de doctor cargado:', doctorResponse.data)
      setDoctor(doctorResponse.data)
      setEditForm(prev => ({
        ...prev,
        first_name: doctorResponse.data.usuario?.first_name || prev.first_name,
        last_name: doctorResponse.data.usuario?.last_name || prev.last_name,
        email: doctorResponse.data.usuario?.email || prev.email,
        telefono: doctorResponse.data.usuario?.telefono || prev.telefono,
        especialidad: doctorResponse.data.especialidad || '',
        otra_especialidad: doctorResponse.data.otra_especialidad || '',
        biografia: doctorResponse.data.biografia || ''
      }))
    } catch (error) {
      console.error('Error cargando perfil de doctor:', error)
    }
  }

  const cargarDatosEnfermera = async (usuarioId) => {
    setLoadingMessage(t('loadingProfessionalInfo'))
    
    try {
      const enfermeraResponse = await axiosInstance.get('mi-perfil-enfermera/')
      console.log('Perfil de enfermera cargado:', enfermeraResponse.data)
      setEnfermera(enfermeraResponse.data)
      setEditForm(prev => ({
        ...prev,
        first_name: enfermeraResponse.data.usuario?.first_name || prev.first_name,
        last_name: enfermeraResponse.data.usuario?.last_name || prev.last_name,
        email: enfermeraResponse.data.usuario?.email || prev.email,
        telefono: enfermeraResponse.data.usuario?.telefono || prev.telefono,
        especialidad: enfermeraResponse.data.especialidad || '',
        otra_especialidad: enfermeraResponse.data.otra_especialidad || '',
        numero_licencia: enfermeraResponse.data.numero_licencia || ''
      }))
    } catch (error) {
      console.error('Error cargando perfil de enfermera:', error)
    }
  }

  const cargarHistorialCitas = async () => {
    setLoadingMessage(t('loadingAppointmentsHistory'))
    
    const citasResponse = await axiosInstance.get('citas/')
    const citasData = Array.isArray(citasResponse.data) ? citasResponse.data : []
    
    const citasCompletadas = citasData.filter(c => 
      c.estado === 'completada' || c.estado === 'cancelada' || c.estado === 'no_asistio'
    )
    
    console.log(`Historial cargado: ${citasCompletadas.length} citas`)
    setHistorialCitas(citasCompletadas)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error del campo
    setPasswordErrors(prev => ({
      ...prev,
      [name]: ''
    }))
  }

  const validatePasswordForm = () => {
    const errors = {}
    
    if (!passwordForm.old_password) {
      errors.old_password = 'A senha atual e obrigatoria'
    }
    
    if (!passwordForm.new_password) {
      errors.new_password = 'A nova senha e obrigatoria'
    } else if (passwordForm.new_password.length < 4) {
      errors.new_password = 'A senha deve ter pelo menos 4 caracteres'
    }
    
    if (!passwordForm.confirm_password) {
      errors.confirm_password = 'Confirme sua nova senha'
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = 'As senhas nao coincidem'
    }
    
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const guardarPerfil = async () => {
    setSaving(true)
    
    try {
      // Actualizar usuario
      await axiosInstance.patch(`usuarios/${user.id}/`, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        telefono: editForm.telefono
      })

      // Subir foto de perfil si se seleccionó una nueva
      if (fotoPerfil) {
        const formDataFoto = new FormData()
        formDataFoto.append('foto', fotoPerfil)
        await axiosInstance.post('foto-perfil/', formDataFoto, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      // Si es paciente, actualizar su perfil
      if (user.rol === 'patient' && paciente) {
        await axiosInstance.patch(`pacientes/${paciente.id}/`, {
          alergias: editForm.alergias,
          grupo_sanguineo: editForm.grupo_sanguineo,
          contacto_emergencia: editForm.contacto_emergencia,
          telefono_emergencia: editForm.telefono_emergencia
        })
      }

      // Si es doctor, actualizar su perfil
      if (user.rol === 'doctor' && doctor) {
        await axiosInstance.patch('mi-perfil-doctor/', {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          telefono: editForm.telefono,
          especialidad: editForm.especialidad,
          otra_especialidad: editForm.otra_especialidad || '',
          biografia: editForm.biografia || ''
        })
      }

      // Si es enfermera, actualizar su perfil
      if (user.rol === 'nurse' && enfermera) {
        await axiosInstance.patch('mi-perfil-enfermera/', {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          telefono: editForm.telefono,
          especialidad: editForm.especialidad,
          otra_especialidad: editForm.otra_especialidad || '',
          numero_licencia: editForm.numero_licencia || ''
        })
      }

      mostrarMensaje(t('profileUpdated'), 'success')
      limpiarFotoPerfilSeleccionada()
      setEditMode(false)
      await fetchUserData() // Recargar datos
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      
      if (error.response?.data) {
        const errors = Object.entries(error.response.data)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('\n')
        mostrarMensaje(t('errorSaving', { type: t('profile').toLowerCase() }) + ':\n' + errors, 'error')
      } else {
        mostrarMensaje(t('errorSaving', { type: t('profile').toLowerCase() }), 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const eliminarFotoPerfil = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await axiosInstance.delete('foto-perfil/')
      mostrarMensaje(`${t('removePhoto')} ${t('success').toLowerCase()}`, 'success')
      await fetchUserData()
    } catch (error) {
      console.error('Error eliminando foto de perfil:', error)
      mostrarMensaje(t('errorSaving', { type: t('profile').toLowerCase() }), 'error')
    } finally {
      setSaving(false)
    }
  }

  const cambiarContrasena = async () => {
    if (!validatePasswordForm()) return
    
    setSaving(true)
    
    try {
      await axiosInstance.post('cambiar-contrasena/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      })

      mostrarMensaje(t('passwordChanged'), 'success')
      setChangePasswordMode(false)
      setPasswordForm({
        old_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      
      if (error.response?.data?.error) {
        mostrarMensaje(error.response.data.error, 'error')
      } else if (error.response?.status === 400) {
        mostrarMensaje(t('currentPasswordIncorrect'), 'error')
      } else {
        mostrarMensaje('Erro ao alterar a senha', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000)
  }

  const getGrupoSanguineoColor = (grupo) => {
    const colores = {
      'A+': '#ff9999',
      'A-': '#ffcccc',
      'B+': '#99ff99',
      'B-': '#ccffcc',
      'AB+': '#9999ff',
      'AB-': '#ccccff',
      'O+': '#ffff99',
      'O-': '#ffffcc'
    }
    return colores[grupo] || '#f0f0f0'
  }

  const formatFecha = (fecha) => {
    try {
      return new Date(fecha).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return fecha
    }
  }

  const getEspecialidadDoctor = () => {
    if (!doctor) return t('notSpecified')
    if (doctor.especialidad_nombre) return doctor.especialidad_nombre
    if (doctor.otra_especialidad) return doctor.otra_especialidad
    return t('notSpecified')
  }

  const getEspecialidadEnfermera = () => {
    if (!enfermera) return t('notSpecified')
    if (enfermera.especialidad_nombre) return enfermera.especialidad_nombre
    if (enfermera.otra_especialidad) return enfermera.otra_especialidad
    return 'Enfermería General'
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <FaSpinner style={styles.loadingSpinner} />
        <p style={styles.loadingText}>{loadingMessage}</p>
        <p style={styles.loadingSubtext}>Por favor espera</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            <FaUser style={styles.titleIcon} />
            {t('myProfile')}
          </h1>
          <p style={styles.subtitle}>
            {user?.rol === 'patient' && t('profileManagePersonalInfo')}
            {user?.rol === 'doctor' && t('profileProfessionalContactInfo')}
            {user?.rol === 'nurse' && t('profileProfessionalContactInfo')}
            {user?.rol === 'admin' && t('profileAdminPanel')}
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← {t('backToDashboard')}
        </button>
      </div>

      {/* Mensajes */}
      {mensaje.texto && (
        <div style={mensaje.tipo === 'success' ? styles.successMessage : styles.errorMessage}>
          {mensaje.tipo === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span style={styles.messageText}>{mensaje.texto}</span>
        </div>
      )}

      {/* Contenido del perfil */}
      <div style={styles.content}>
        {/* Columna izquierda */}
        <div style={styles.leftColumn}>
          {/* Tarjeta de información personal */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <FaUser style={styles.cardIcon} />
                <h2>{t('personalInfo')}</h2>
              </div>
              {!editMode && !changePasswordMode && (
                <button 
                  onClick={() => setEditMode(true)} 
                  style={styles.editButton}
                  title={t('editProfile')}
                >
                  <FaEdit /> {t('edit')}
                </button>
              )}
            </div>

            {editMode ? (
              // Modo edición
              <div style={styles.editForm}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      <FaUser /> {t('fullName')}
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={editForm.first_name}
                      onChange={handleEditChange}
                      style={styles.input}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      <FaUser /> Apellido
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={editForm.last_name}
                      onChange={handleEditChange}
                      style={styles.input}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <FaEnvelope /> {t('email')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    style={styles.input}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                 <div style={styles.formGroup}>
                   <label style={styles.label}>
                     <FaPhone /> Teléfono
                   </label>
                   <input
                     type="text"
                     name="telefono"
                     value={editForm.telefono}
                     onChange={handleEditChange}
                     style={styles.input}
                     placeholder="+244 XXX XXX XXX"
                   />
                 </div>

                 {user?.rol !== 'patient' && (
                   <div style={styles.formGroup}>
                     <label style={styles.label}>
                       <FaUser /> {t('profilePhoto')}
                     </label>
                     {user?.foto_perfil_url && (
                       <div style={styles.photoPreview}>
                         <img
                           src={user.foto_perfil_url}
                           alt={t('currentProfilePhoto')}
                           style={styles.previewImage}
                         />
                         <p style={styles.currentPhotoLabel}>{t('currentPhoto')}</p>
                         <button
                           type="button"
                           onClick={eliminarFotoPerfil}
                           style={{
                             marginTop: '8px',
                             backgroundColor: 'var(--color-danger)',
                             color: 'white',
                             border: 'none',
                             padding: '8px 12px',
                             borderRadius: '6px',
                             cursor: 'pointer'
                           }}
                         >
                           {t('removePhoto')}
                         </button>
                       </div>
                     )}
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleFotoPerfilChange}
                       style={styles.fileInput}
                     />
                     {fotoPerfilPreview && (
                       <div style={styles.photoPreview}>
                         <img
                           src={fotoPerfilPreview}
                           alt={t('newImageSelected')}
                           style={styles.previewImage}
                         />
                         <p style={styles.currentPhotoLabel}>{t('newImageSelected')}</p>
                       </div>
                     )}
                     <small style={styles.hint}>
                       {t('photoRequirements')}: JPEG, PNG, GIF, WebP. Máx 25MB.
                     </small>
                   </div>
                 )}

                 {user?.rol === 'patient' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        <FaAllergies /> Alergias
                      </label>
                      <textarea
                        name="alergias"
                        value={editForm.alergias}
                        onChange={handleEditChange}
                        style={styles.textarea}
                        rows="3"
                        placeholder="Ej: Penicilina, polen, mariscos..."
                      />
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaTint /> Grupo Sanguíneo
                        </label>
                        <select
                          name="grupo_sanguineo"
                          value={editForm.grupo_sanguineo}
                          onChange={handleEditChange}
                          style={styles.select}
                        >
                          <option value="">{t('select')}</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaAddressCard /> {t('emergencyContact')}
                        </label>
                        <input
                          type="text"
                          name="contacto_emergencia"
                          value={editForm.contacto_emergencia}
                          onChange={handleEditChange}
                          style={styles.input}
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          <FaPhone /> Tel. emergencia
                        </label>
                        <input
                          type="text"
                          name="telefono_emergencia"
                          value={editForm.telefono_emergencia}
                          onChange={handleEditChange}
                          style={styles.input}
                          placeholder="+244 XXX XXX XXX"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div style={styles.editButtons}>
                  <button 
                    onClick={guardarPerfil} 
                    style={styles.saveButton}
                    disabled={saving}
                  >
                    {saving ? <FaSpinner style={styles.spinner} /> : <FaSave />}
                    {saving ? t('saving') : t('saveChanges')}
                  </button>
                   <button
                     onClick={() => {
                       setEditMode(false)
                       limpiarFotoPerfilSeleccionada()
                     }}
                     style={styles.cancelButton}
                     disabled={saving}
                   >
                    <FaTimes /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Modo visualización
              <div style={styles.infoDisplay}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Nombre completo:</span>
                    <span style={styles.infoValue}>
                      {user?.first_name} {user?.last_name || t('notSpecified')}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>{t('email')}:</span>
                    <span style={styles.infoValue}>{user?.email || t('notSpecified')}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>{t('phone')}:</span>
                    <span style={styles.infoValue}>{user?.telefono || t('notSpecified')}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Rol:</span>
                    <span style={{
                      ...styles.rolBadge,
                      backgroundColor: user?.rol === 'admin' ? 'var(--color-admin)' :
                                    user?.rol === 'doctor' ? 'var(--color-doctor)' :
                                    user?.rol === 'nurse' ? 'var(--color-nurse)' : 'var(--color-patient)'
                    }}>
                      {user?.rol === 'admin' && t('administrator')}
                      {user?.rol === 'doctor' && t('doctor')}
                      {user?.rol === 'nurse' && t('nurse')}
                      {user?.rol === 'patient' && t('patient')}
                    </span>
                  </div>
                 </div>

                 {/* Foto de perfil */}
                 {user?.foto_perfil_url && (
                   <div style={styles.photoDisplay}>
                     <h4 style={styles.photoTitle}>{t('profilePhoto')}:</h4>
                     <div style={styles.photoContainer}>
                       <img
                         src={user.foto_perfil_url}
                         alt={t('profilePhoto')}
                         style={styles.profileImage}
                       />
                     </div>
                   </div>
                 )}

                 {/* Información específica para pacientes */}
                {user?.rol === 'patient' && paciente && (
                  <div style={styles.medicalInfo}>
                    <h3 style={styles.medicalTitle}>
                      <FaHeart style={styles.medicalIcon} />
                      {t('medicalInfo')}
                    </h3>
                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>{t('allergies')}:</span>
                        <span style={styles.infoValue}>{paciente.alergias || t('notSpecified')}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>{t('bloodType')}:</span>
                        <span style={{
                          ...styles.grupoSanguineo,
                          backgroundColor: getGrupoSanguineoColor(paciente.grupo_sanguineo)
                        }}>
                          {paciente.grupo_sanguineo || t('notSpecified')}
                        </span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>{t('emergencyContact')}:</span>
                        <span style={styles.infoValue}>{paciente.contacto_emergencia || t('notSpecified')}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>{t('emergencyPhone')}:</span>
                        <span style={styles.infoValue}>{paciente.telefono_emergencia || t('notSpecified')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información específica para doctores */}
                {user?.rol === 'doctor' && doctor && (
                  <div style={styles.medicalInfo}>
                    <h3 style={styles.medicalTitle}>
                      <FaUserMd style={styles.medicalIcon} />
                      {t('professionalInfo')}
                    </h3>
                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>{t('specialty')}:</span>
                        <span style={styles.infoValue}>{getEspecialidadDoctor()}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>{t('biography')}:</span>
                        <span style={styles.infoValue}>{doctor.biografia || t('notSpecified')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información específica para enfermeras */}
                {user?.rol === 'nurse' && enfermera && (
                  <div style={styles.medicalInfo}>
                    <h3 style={styles.medicalTitle}>
                      <FaClipboardList style={styles.medicalIcon} />
                      {t('professionalInfo')}
                    </h3>
                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>{t('specialty')}:</span>
                        <span style={styles.infoValue}>{getEspecialidadEnfermera()}</span>
                      </div>
                      {enfermera.numero_licencia && (
                        <div style={styles.infoItem}>
                          <span style={styles.infoLabel}>Nº Licencia:</span>
                          <span style={styles.infoValue}>{enfermera.numero_licencia}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tarjeta de seguridad (cambio de contraseña) */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <FaKey style={styles.cardIcon} />
                <h2>Seguridad</h2>
              </div>
              {!changePasswordMode && !editMode && (
                <button 
                  onClick={() => setChangePasswordMode(true)} 
                  style={styles.editButton}
                  title={t('changePassword')}
                >
                  <FaKey /> {t('changePassword')}
                </button>
              )}
            </div>

            {changePasswordMode ? (
              <div style={styles.editForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('currentPassword')}:</label>
                  <input
                    type="password"
                    name="old_password"
                    value={passwordForm.old_password}
                    onChange={handlePasswordChange}
                    style={{...styles.input, borderColor: passwordErrors.old_password ? '#e74c3c' : 'var(--border-color)'}}
                    placeholder="••••••••"
                  />
                  {passwordErrors.old_password && (
                    <span style={styles.fieldError}>{passwordErrors.old_password}</span>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('newPassword')}:</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    style={{...styles.input, borderColor: passwordErrors.new_password ? '#e74c3c' : 'var(--border-color)'}}
                    placeholder="••••••••"
                  />
                  {passwordErrors.new_password && (
                    <span style={styles.fieldError}>{passwordErrors.new_password}</span>
                  )}
                  <span style={styles.passwordHint}>{t('minimum4Characters')}</span>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('confirmNewPassword')}:</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                    style={{...styles.input, borderColor: passwordErrors.confirm_password ? '#e74c3c' : 'var(--border-color)'}}
                    placeholder="••••••••"
                  />
                  {passwordErrors.confirm_password && (
                    <span style={styles.fieldError}>{passwordErrors.confirm_password}</span>
                  )}
                </div>

                <div style={styles.editButtons}>
                  <button 
                    onClick={cambiarContrasena} 
                    style={styles.saveButton}
                    disabled={saving}
                  >
                    {saving ? <FaSpinner style={styles.spinner} /> : <FaKey />}
                    {saving ? t('saving') : t('changePassword')}
                  </button>
                  <button 
                    onClick={() => {
                      setChangePasswordMode(false)
                      setPasswordForm({
                        old_password: '',
                        new_password: '',
                        confirm_password: ''
                      })
                      setPasswordErrors({})
                    }} 
                    style={styles.cancelButton}
                    disabled={saving}
                  >
                    <FaTimes /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.passwordDisplay}>
                <FaKey style={styles.passwordIcon} />
                <span style={styles.passwordPlaceholder}>••••••••</span>
                <span style={styles.passwordHint}>A senha esta criptografada por seguranca</span>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha - Historial médico (para todos los roles) */}
        <div style={styles.rightColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <FaHistory style={styles.cardIcon} />
                <h2>{t('appointmentHistory')}</h2>
              </div>
              <span style={styles.historialCount}>
                {historialCitas.length} {t('appointments')}
              </span>
            </div>
            
            {historialCitas.length === 0 ? (
              <div style={styles.emptyState}>
                <FaHistory style={styles.emptyIcon} />
                <p style={styles.emptyText}>{t('noAppointmentHistory')}</p>
                <p style={styles.emptySubtext}>{t('completedAppointmentsAppearHere')}</p>
              </div>
            ) : (
              <div style={styles.historialList}>
                {historialCitas.map((cita) => (
                  <div key={cita.id} style={styles.historialItem}>
                    <div style={styles.historialHeader}>
                      <span style={styles.historialDate}>
                        <FaHistory style={styles.historialDateIcon} />
                        {formatFecha(cita.fecha)} - {cita.hora}
                      </span>
                      <span style={{
                        ...styles.historialBadge,
                        backgroundColor: cita.estado === 'completada' ? '#27ae60' : 
                                       cita.estado === 'cancelada' ? '#e74c3c' : '#f39c12'
                      }}>
                        {cita.estado}
                      </span>
                    </div>
                    <div style={styles.historialBody}>
                      <div style={styles.historialDoctor}>
                        <FaUserMd style={styles.historialDoctorIcon} />
                        {t('dr')} {cita.doctor_nombre || t('notSpecified')}
                      </div>
                      {cita.motivo && (
                        <div style={styles.historialMotivo}>
                          <strong>Motivo:</strong> {cita.motivo}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Estilos (se mantienen igual, solo actualizados los colores de los badges)
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-primary)',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
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
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  title: {
    fontSize: '28px',
    color: 'var(--text-primary)',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  titleIcon: {
    color: 'var(--color-patient)'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: 0
  },
  backButton: {
    backgroundColor: 'var(--text-muted)',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  successMessage: {
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success-text)',
    padding: '15px 20px',
    borderRadius: '10px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #c3e6cb'
  },
  errorMessage: {
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error-text)',
    padding: '15px 20px',
    borderRadius: '10px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #f5c6cb'
  },
  messageText: {
    fontSize: '14px',
    flex: 1
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '15px'
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-primary)'
  },
  cardIcon: {
    fontSize: '20px',
    color: 'var(--color-patient)'
  },
  editButton: {
    backgroundColor: 'var(--color-patient)',
    color: 'white',
    padding: '8px 15px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '13px'
  },
  infoDisplay: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  infoLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoValue: {
    fontSize: '15px',
    color: 'var(--text-primary)',
    fontWeight: '500'
  },
  rolBadge: {
    padding: '4px 10px',
    borderRadius: '15px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
    width: 'fit-content'
  },
  medicalInfo: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px dashed var(--border-color)'
  },
  medicalTitle: {
    fontSize: '16px',
    color: 'var(--text-primary)',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  medicalIcon: {
    color: '#e74c3c'
  },
  grupoSanguineo: {
    padding: '4px 10px',
    borderRadius: '15px',
    fontWeight: 'bold',
    display: 'inline-block',
    width: 'fit-content'
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px'
  },
  formGroup: {
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
  input: {
    padding: '10px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  textarea: {
    padding: '10px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '16px',
    resize: 'vertical',
    minHeight: '80px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  select: {
    padding: '10px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  editButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  saveButton: {
    backgroundColor: 'var(--color-success)',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  cancelButton: {
    backgroundColor: 'var(--color-cancelled)',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  fieldError: {
    color: '#e74c3c',
    fontSize: '12px',
    marginTop: '3px'
  },
  passwordDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-muted)'
  },
  passwordIcon: {
    fontSize: '20px'
  },
  passwordPlaceholder: {
    fontSize: '20px',
    letterSpacing: '2px'
  },
  passwordHint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '3px'
  },
  historialCount: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '4px 10px',
    borderRadius: '15px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  emptyIcon: {
    fontSize: '48px',
    color: 'var(--text-muted)',
    marginBottom: '15px'
  },
  emptyText: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    marginBottom: '5px'
  },
  emptySubtext: {
    fontSize: '14px',
    color: 'var(--text-muted)'
  },
  historialList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  historialItem: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)'
  },
  historialHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1px dashed var(--border-color)'
  },
  historialDate: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  historialDateIcon: {
    fontSize: '12px',
    color: 'var(--color-patient)'
  },
  historialBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  historialBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  historialDoctor: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  historialDoctorIcon: {
    fontSize: '12px',
    color: '#e67e22'
  },
  historialMotivo: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    backgroundColor: 'var(--bg-secondary)',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  photoPreview: {
    marginTop: '10px',
    padding: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'inline-block'
  },
  previewImage: {
    maxWidth: '100px',
    maxHeight: '100px',
    objectFit: 'cover',
    borderRadius: '4px',
    display: 'block'
  },
  currentPhotoLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: '8px'
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '14px'
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  photoDisplay: {
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px dashed var(--border-color)'
  },
  photoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '10px'
  },
  photoContainer: {
    display: 'flex',
    justifyContent: 'center'
  },
  profileImage: {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '50%',
    border: '3px solid var(--border-color)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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

export default Perfil