import React, { useEffect, useState, useRef } from 'react'
import axiosInstance from '../services/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { FaCalendarAlt, FaClock, FaUserMd, FaNotesMedical, FaCheck, FaTimes, FaComment, FaSave, FaBan } from 'react-icons/fa'
import { format, addDays, parseISO } from 'date-fns'
import { ptBR, es } from 'date-fns/locale'
import ChatIA from './ChatIA'

function Citas() {
  const { t } = useLanguage()
  const [citas, setCitas] = useState([])
  const [doctores, setDoctores] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [mostrarChatIA, setMostrarChatIA] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [horariosDisponibles, setHorariosDisponibles] = useState([])
  const [cargandoHorarios, setCargandoHorarios] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [user, setUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [formData, setFormData] = useState({})
  const [pacientes, setPacientes] = useState([])
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [patientSuggestions, setPatientSuggestions] = useState([])
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false)
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('')
  const [doctorSuggestions, setDoctorSuggestions] = useState([])
  const [showDoctorSuggestions, setShowDoctorSuggestions] = useState(false)
  const [slotsModal, setSlotsModal] = useState([])
  const [cargandoSlotsModal, setCargandoSlotsModal] = useState(false)
  const [errorSlotsModal, setErrorSlotsModal] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const modalTitleRef = useRef(null)

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal()
      }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [showModal])
  
  const [nuevaCita, setNuevaCita] = useState({
    doctor: location.state?.doctorSeleccionado?.id || '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    hora: '',
    motivo: ''
  })
  const historyRef = useRef(null)

  useEffect(() => {
    fetchUser()
    fetchCitas()
    fetchDoctores()
  }, [])

   useEffect(() => {
     if (nuevaCita.doctor && nuevaCita.fecha) {
       fetchHorariosDisponibles()
     }
   }, [nuevaCita.doctor, nuevaCita.fecha])

   // Cargar slots para el modal cuando cambian doctor o fecha
   useEffect(() => {
     // Si el usuario es doctor y aún no se ha asignado doctor en formData, intentar asignarlo
     if (!formData.doctor && user?.rol === 'doctor' && doctores.length > 0) {
       const miDoctor = doctores.find(d => d.usuario?.id === user.id);
       if (miDoctor) {
         setFormData(prev => ({ ...prev, doctor: miDoctor.id }));
         return; // El effect se volverá a ejecutar cuando formData.doctor cambie
       }
     }

     if (formData.doctor && formData.fecha) {
       // Resetear hora seleccionada al cambiar fecha
       setFormData(prev => ({ ...prev, hora: '' }))
       fetchSlotsModal()
     }
   }, [formData.doctor, formData.fecha, user, doctores])

  const fetchCitas = async () => {
    try {
      const response = await axiosInstance.get('mis-citas/')
      // Asegurar que siempre sea un array
      const citasData = Array.isArray(response.data) ? response.data : response.data.results || []
      setCitas(citasData)
    } catch (error) {
      console.error('Error cargando citas:', error)
      setCitas([]) // En caso de error, dejar array vacío
      mostrarMensaje(t('connectionError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctores = async () => {
    try {
      const response = await axiosInstance.get('doctores-publicos/')
      const doctoresData = Array.isArray(response.data) ? response.data : response.data.results || []
      setDoctores(doctoresData)
    } catch (error) {
      console.error('Error cargando doctores:', error)
      setDoctores([])
    }
  }

  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get('usuario-actual/')
      setUser(response.data)
      if (response.data.rol === 'doctor' || response.data.rol === 'admin' || response.data.rol === 'nurse') {
        fetchPacientes()
      }
    } catch (error) {
      console.error('Error cargando usuario:', error)
    }
  }

  const fetchPacientes = async () => {
    try {
      const response = await axiosInstance.get('pacientes/')
      const pacientesData = Array.isArray(response.data) ? response.data : response.data.results || []
      setPacientes(pacientesData)
    } catch (error) {
      console.error('Error cargando pacientes:', error)
      setPacientes([])
    }
  }

   const fetchHorariosDisponibles = async () => {
     setCargandoHorarios(true)
     try {
       const response = await axiosInstance.get(`horarios/disponibles/?doctor=${nuevaCita.doctor}&fecha=${nuevaCita.fecha}`)
       const horariosData = Array.isArray(response.data) ? response.data : []

       const citasResponse = await axiosInstance.get('citas/', {
         params: {
           doctor: nuevaCita.doctor,
           fecha: nuevaCita.fecha
         }
       })
       const citasOcupadas = Array.isArray(citasResponse.data) ? citasResponse.data : []
       const horariosOcupados = citasOcupadas.map(c => c.hora)

       const slots = []
       horariosData.forEach(horario => {
         if (!horario.activo) return

         const [horaInicio, minInicio] = horario.hora_inicio.split(':').map(Number)
         const [horaFin, minFin] = horario.hora_fin.split(':').map(Number)

         let horaActual = new Date()
         horaActual.setHours(horaInicio, minInicio, 0)

         const horaFinal = new Date()
         horaFinal.setHours(horaFin, minFin, 0)

         while (horaActual < horaFinal) {
           const horaStr = format(horaActual, 'HH:mm')
           if (!horariosOcupados.includes(horaStr)) {
             slots.push(horaStr)
           }
           horaActual.setMinutes(horaActual.getMinutes() + 30)
         }
       })

       setHorariosDisponibles(slots)
     } catch (error) {
       console.error('Error cargando horarios:', error)
       setHorariosDisponibles([])
     } finally {
       setCargandoHorarios(false)
     }
   }

   const fetchSlotsModal = async () => {
     setCargandoSlotsModal(true)
     setErrorSlotsModal(null)
     try {
       const doctorId = formData.doctor
       const response = await axiosInstance.get(`horarios/disponibles/?doctor=${doctorId}&fecha=${formData.fecha}`)
       const horariosData = Array.isArray(response.data) ? response.data : []

       const citasResponse = await axiosInstance.get('citas/', {
         params: { doctor: doctorId, fecha: formData.fecha }
       })
       const citasOcupadas = Array.isArray(citasResponse.data) ? citasResponse.data : (citasResponse.data.results || [])
       const horasOcupadas = citasOcupadas.map(c => c.hora)

       const slots = []
       const ahora = new Date()
       const esHoy = formData.fecha === ahora.toISOString().split('T')[0]

       horariosData.forEach(horario => {
         if (!horario.activo) return
         const [horaInicio, minInicio] = horario.hora_inicio.split(':').map(Number)
         const [horaFin, minFin] = horario.hora_fin.split(':').map(Number)

         let horaActual = new Date()
         horaActual.setHours(horaInicio, minInicio, 0)
         const horaFinal = new Date()
         horaFinal.setHours(horaFin, minFin, 0)

         while (horaActual < horaFinal) {
           const horaStr = horaActual.toTimeString().slice(0, 5)
           if (!horasOcupadas.includes(horaStr)) {
             if (esHoy) {
               if (horaActual > ahora) {
                 slots.push(horaStr)
               }
             } else {
               slots.push(horaStr)
             }
           }
           horaActual.setMinutes(horaActual.getMinutes() + 30)
         }
       })

       setSlotsModal(slots)
     } catch (error) {
       console.error('Error cargando horarios modal:', error)
       setErrorSlotsModal('Error al cargar horarios')
       setSlotsModal([])
     } finally {
       setCargandoSlotsModal(false)
     }
   }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNuevaCita(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleInputChangeForm = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!nuevaCita.doctor || !nuevaCita.fecha || !nuevaCita.hora) {
      mostrarMensaje(t('requiredField'), 'error')
      return
    }

    try {
      await axiosInstance.post('citas/', nuevaCita)
      
      mostrarMensaje(t('appointmentBooked'), 'success')
      setShowForm(false)
      fetchCitas()
      
      setNuevaCita({
        doctor: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        hora: '',
        motivo: ''
      })
    } catch (error) {
      console.error('Error creando cita:', error)
      mostrarMensaje(error.response?.data?.message || t('errorSaving', { type: t('appointments').toLowerCase() }), 'error')
    }
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()

    if (!formData.doctor || !formData.fecha || !formData.hora) {
      mostrarMensaje(t('requiredField'), 'error')
      return
    }

    // Validar que la hora esté disponible
    if (cargandoSlotsModal) {
      mostrarMensaje('Espere a que carguen los horarios', 'error')
      return
    }
    if (slotsModal.length === 0) {
      mostrarMensaje('No hay horarios disponibles para la fecha seleccionada', 'error')
      return
    }
    if (!slotsModal.includes(formData.hora)) {
      mostrarMensaje('La hora seleccionada no está disponible', 'error')
      return
    }

    if ((user?.rol === 'doctor' || user?.rol === 'admin') && !formData.paciente) {
      mostrarMensaje(t('selectPatient'), 'error')
      return
    }

    try {
      const citaData = {
        paciente: formData.paciente,
        doctor: formData.doctor,
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo
      }

      await axiosInstance.post('citas/', citaData)

      mostrarMensaje(t('appointmentBooked'), 'success')
      setShowModal(false)
      fetchCitas()
    } catch (error) {
      console.error('Error creando cita:', error)
      mostrarMensaje(error.response?.data?.message || t('errorSaving', { type: t('appointments').toLowerCase() }), 'error')
    }
  }

  const cancelarCita = async (citaId) => {
    if (!window.confirm(t('confirmCancel'))) return
    
    try {
      await axiosInstance.delete(`citas/${citaId}/`)
      mostrarMensaje(t('appointmentCancelled'), 'success')
      fetchCitas()
    } catch (error) {
      console.error('Error cancelando cita:', error)
      mostrarMensaje(t('errorDeleting', { type: t('appointments').toLowerCase() }), 'error')
    }
  }

  const handlePatientSearchChange = (e) => {
    const query = e.target.value
    setPatientSearchQuery(query)
    if (query.length > 0) {
      const filtered = pacientes.filter(p => {
        const firstName = p.usuario?.first_name || p.first_name || ''
        const lastName = p.usuario?.last_name || p.last_name || ''
        const username = p.usuario?.username || p.username || ''
        const email = p.usuario?.email || p.email || ''
        return `${firstName} ${lastName}`.toLowerCase().includes(query.toLowerCase()) ||
          username.toLowerCase().includes(query.toLowerCase()) ||
          (email && email.toLowerCase().includes(query.toLowerCase()))
      })
      setPatientSuggestions(filtered.slice(0, 5))
      setShowPatientSuggestions(true)
    } else {
      setPatientSuggestions([])
      setShowPatientSuggestions(false)
    }
  }

  const selectPatient = (paciente) => {
    setFormData(prev => ({ ...prev, paciente: paciente.id }))
    setPatientSearchQuery(`${paciente.usuario?.first_name || paciente.first_name} ${paciente.usuario?.last_name || paciente.last_name}`)
    setShowPatientSuggestions(false)
  }

  const closePatientSuggestions = () => {
    setTimeout(() => setShowPatientSuggestions(false), 200)
  }

  const handleDoctorSearchChange = (e) => {
    const query = e.target.value
    setDoctorSearchQuery(query)
    if (query.length > 0) {
      const filtered = doctores.filter(d => {
        const firstName = d.usuario?.first_name || d.first_name || ''
        const lastName = d.usuario?.last_name || d.last_name || ''
        const username = d.usuario?.username || d.username || ''
        const email = d.usuario?.email || d.email || ''
        const specialty = d.especialidad_nombre || d.otra_especialidad || ''
        return `Dr. ${firstName} ${lastName} ${specialty}`.toLowerCase().includes(query.toLowerCase()) ||
          username.toLowerCase().includes(query.toLowerCase()) ||
          (email && email.toLowerCase().includes(query.toLowerCase()))
      })
      setDoctorSuggestions(filtered.slice(0, 5))
      setShowDoctorSuggestions(true)
    } else {
      setDoctorSuggestions([])
      setShowDoctorSuggestions(false)
    }
  }

  const selectDoctor = (doctor) => {
    setFormData(prev => ({ ...prev, doctor: doctor.id }))
    const firstName = doctor.usuario?.first_name || doctor.first_name || ''
    const lastName = doctor.usuario?.last_name || doctor.last_name || ''
    const specialty = doctor.especialidad_nombre || doctor.otra_especialidad || t('unspecifiedSpecialty')
    setDoctorSearchQuery(`${t('dr')} ${firstName} ${lastName} - ${specialty}`)
    setShowDoctorSuggestions(false)
  }

  const closeDoctorSuggestions = () => {
    setTimeout(() => setShowDoctorSuggestions(false), 200)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({})
    setPatientSearchQuery('')
  }

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000)
  }

  const handleCreateCita = () => {
    setModalMode('create')
    let doctorId = ''
    if (user?.rol === 'doctor') {
      const miDoctor = doctores.find(d => d.usuario?.id === user.id)
      doctorId = miDoctor ? miDoctor.id : ''
    } else {
      doctorId = location.state?.doctorSeleccionado?.id || ''
    }
    setFormData({
      paciente: user?.rol === 'patient' ? user.id : '',
      doctor: doctorId,
      fecha: format(new Date(), 'yyyy-MM-dd'),
      hora: '',
      motivo: ''
    })
    setPatientSearchQuery('')
    setShowModal(true)
  }

  const getEstadoBadge = (estado) => {
    const estilos = {
      pendiente: { backgroundColor: 'var(--color-pending)', color: 'white' },
      confirmada: { backgroundColor: 'var(--color-confirmed)', color: 'white' },
      completada: { backgroundColor: 'var(--color-completed)', color: 'white' },
      cancelada: { backgroundColor: 'var(--color-cancelled)', color: 'white' },
      no_asistio: { backgroundColor: 'var(--color-no-show)', color: 'white' }
    }
    return <span style={{...styles.badge, ...estilos[estado]}}>{estado}</span>
  }

  // Verificar que citas es un array antes de filtrar
  const citasArray = Array.isArray(citas) ? citas : []
  const now = new Date()
  const citasProximas = citasArray.filter(c => new Date(`${c.fecha}T${c.hora}`) > now)
  const citasPasadas = citasArray.filter(c => new Date(`${c.fecha}T${c.hora}`) <= now)

  if (loading) {
    return <div style={styles.loading}>{t('loading')}</div>
  }

  return (
    <div style={styles.container}>
      <style>{styles.dateTimeInput}</style>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>📅 {t('appointmentsManagement')}</h1>
        <div style={styles.headerActions}>
          <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
            ← {t('back')}
          </button>
          <button onClick={() => setMostrarChatIA(true)} style={styles.chatButton}>
            <span style={{fontSize: '24px'}}>🤖</span>
          </button>
          <button onClick={() => handleCreateCita()} style={styles.newButton}>
            + {t('newAppointment')}
          </button>
        </div>
      </div>

      {mensaje.texto && (
        <div style={mensaje.tipo === 'success' ? styles.successMessage : styles.errorMessage}>
          {mensaje.texto}
        </div>
      )}

      {mostrarChatIA && (
        <ChatIA onClose={() => setMostrarChatIA(false)} />
      )}

      <div style={styles.citasContainer}>
        <div style={styles.section}>
          <h2>📌 {t('upcomingAppointments')}</h2>
          {citasProximas.length === 0 ? (
            <p style={styles.emptyState}>{t('noUpcomingAppointments')}</p>
          ) : (
            citasProximas.map(cita => (
              <div key={cita.id} style={styles.citaCard}>
                <div style={styles.citaHeader}>
                  <div style={styles.citaDoctor}>
                    <FaUserMd /> {t('dr')} {cita.doctor_nombre}
                  </div>
                  {getEstadoBadge(cita.estado)}
                </div>
                <div style={styles.citaBody}>
                   <p><FaCalendarAlt /> {t('date')}: {format(parseISO(cita.fecha), 'PPP', { locale: es })}</p>
                   <p><FaClock /> {t('time')}: {cita.hora}</p>
                   {cita.motivo && (
                     <p><FaNotesMedical /> {t('reason')}: {cita.motivo}</p>
                   )}
                </div>
                {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                  <div style={styles.citaFooter}>
                    <button onClick={() => cancelarCita(cita.id)} style={styles.cancelButton}>
                      <FaTimes /> {t('cancelAppointment')}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={styles.section}>
          <h2 ref={historyRef}>📋 {t('appointmentHistory')}</h2>
          {citasPasadas.length === 0 ? (
            <p style={styles.emptyState}>{t('noPastAppointments')}</p>
          ) : (
            citasPasadas.map(cita => (
              <div key={cita.id} style={styles.citaCardHistorial}>
                <div style={styles.citaHeader}>
                  <div style={styles.citaDoctor}>
                    <FaUserMd /> {t('dr')} {cita.doctor_nombre}
                  </div>
                  {getEstadoBadge(cita.estado)}
                </div>
                <div style={styles.citaBody}>
                   <p><FaCalendarAlt /> {format(parseISO(cita.fecha), 'PPP', { locale: es })} - {cita.hora}</p>
                   {cita.motivo && <p>{t('reason')}: {cita.motivo}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para crear cita */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}
             role="dialog" aria-modal="true" aria-labelledby="citas-modal-title">
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 id="citas-modal-title" style={styles.modalTitle}
                ref={modalTitleRef}>{t('createNew')} {t('appointment')}</h2>
            
            <form onSubmit={handleSubmitForm}>
              {/* Selección de paciente para doctor/admin/enfermera */}
              {(user?.rol === 'doctor' || user?.rol === 'admin' || user?.rol === 'nurse') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('patient')} *</label>
                  <div style={styles.autocompleteContainer}>
                    <input
                      type="text"
                      name="pacienteSearch"
                      value={patientSearchQuery}
                      onChange={handlePatientSearchChange}
                      onFocus={() => {
                        if (patientSearchQuery.length > 0) {
                          setShowPatientSuggestions(true)
                        }
                      }}
                      onBlur={closePatientSuggestions}
                      style={styles.input}
                      placeholder={t('typeToSearchPatient')}
                      autoComplete="off"
                    />
                    {showPatientSuggestions && (
                      <div style={styles.suggestionsList}>
                        {patientSuggestions.length > 0 ? (
                          patientSuggestions.map(paciente => (
                            <div
                              key={paciente.id}
                              style={styles.suggestionItem}
                              onClick={() => selectPatient(paciente)}
                            >
                              {paciente.foto_perfil_url && (
                                <img
                                  src={paciente.foto_perfil_url}
                                  alt={`${paciente.first_name} ${paciente.last_name}`}
                                  style={styles.profilePhoto}
                                />
                              )}
                              <span style={styles.suggestionName}>
                                {paciente.usuario?.first_name || paciente.first_name} {paciente.usuario?.last_name || paciente.last_name}
                              </span>
                              <span style={styles.suggestionUsername}>
                                @{paciente.usuario?.username || paciente.username}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div style={styles.noResults}>
                            {t('noPatientsFound')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!formData.paciente && (
                    <span style={styles.fieldHint}>{t('selectPatient')}</span>
                  )}
                </div>
              )}

              {/* Selección de doctor para paciente/admin */}
              {(user?.rol === 'patient' || user?.rol === 'admin') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('doctor')} *</label>
                  <div style={styles.autocompleteContainer}>
                    <input
                      type="text"
                      name="doctorSearch"
                      value={doctorSearchQuery}
                      onChange={handleDoctorSearchChange}
                      onFocus={() => {
                        if (doctorSearchQuery.length > 0) {
                          setShowDoctorSuggestions(true)
                        }
                      }}
                      onBlur={closeDoctorSuggestions}
                      style={styles.input}
                      placeholder={t('typeToSearchDoctor')}
                      autoComplete="off"
                    />
                    {showDoctorSuggestions && (
                      <div style={styles.suggestionsList}>
                        {doctorSuggestions.length > 0 ? (
                          doctorSuggestions.map(doctor => (
                            <div
                              key={doctor.id}
                              style={styles.suggestionItem}
                              onClick={() => selectDoctor(doctor)}
                            >
                              {doctor.usuario?.foto_perfil_url && (
                                <img
                                  src={doctor.usuario.foto_perfil_url}
                                  alt={`Dr. ${doctor.usuario?.first_name} ${doctor.usuario?.last_name}`}
                                  style={styles.profilePhoto}
                                />
                              )}
                              <span style={styles.suggestionName}>
                                {t('dr')} {doctor.usuario?.first_name || doctor.first_name} {doctor.usuario?.last_name || doctor.last_name}
                              </span>
                              <span style={styles.suggestionSpecialty}>
                                {doctor.especialidad_nombre || doctor.otra_especialidad || t('unspecifiedSpecialty')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div style={styles.noResults}>
                            {t('noDoctorsFound')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!formData.doctor && (
                    <span style={styles.fieldHint}>{t('selectDoctor')}</span>
                  )}
                </div>
              )}
              
               <div style={styles.formRow}>
                 <div style={styles.formGroup}>
                   <label style={styles.label}>{t('date')} *</label>
                   <input
                     type="date"
                     name="fecha"
                     value={formData.fecha || ''}
                     onChange={handleInputChangeForm}
                     style={styles.input}
                     min={new Date().toISOString().split('T')[0]}
                     required
                   />
                 </div>
                 <div style={styles.formGroup}>
                   <label style={styles.label}>{t('time')} *</label>
                   <input
                     type="time"
                     name="hora"
                     value={formData.hora || ''}
                     onChange={handleInputChangeForm}
                     style={styles.input}
                     required
                     disabled={slotsModal.length === 0}
                   />
                 </div>
               </div>

               {/* Mostrar estado de horarios disponibles */}
               <div style={styles.formGroup}>
                 {cargandoSlotsModal && <p style={styles.loadingSmall}>Cargando horarios disponibles...</p>}
                 {!cargandoSlotsModal && errorSlotsModal && <p style={{color: 'var(--color-error)'}}>{errorSlotsModal}</p>}
                 {!cargandoSlotsModal && slotsModal.length === 0 && formData.fecha && !errorSlotsModal && (
                   <p style={{color: 'var(--color-error)'}}>No hay horarios disponibles para esta fecha (el doctor no atiende o está completo).</p>
                 )}
               </div>

              {user?.rol !== 'patient' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('status')} *</label>
                  <select
                    name="estado"
                    value={formData.estado || 'pendiente'}
                    onChange={handleInputChangeForm}
                    style={styles.select}
                  >
                    <option value="pendente">{t('pending')}</option>
                    <option value="confirmada">{t('confirmed')}</option>
                    <option value="completada">{t('completed')}</option>
                    <option value="cancelada">{t('cancelled')}</option>
                    <option value="no_asistio">{t('noShow')}</option>
                  </select>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>{t('appointmentReason')} ({t('optional')})</label>
                <textarea
                  name="motivo"
                  value={formData.motivo || ''}
                  onChange={handleInputChangeForm}
                  style={styles.textarea}
                  rows="3"
                  placeholder={t('describeReason')}
                />
              </div>
              
               <div style={styles.modalButtons}>
                 <button type="submit" style={styles.saveButton} disabled={cargandoSlotsModal || slotsModal.length === 0}>
                   <FaSave />
                   {t('save')}
                 </button>
                 <button type="button" onClick={handleCloseModal} style={styles.modalCancelButton}>
                   <FaBan />
                   {t('cancel')}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {mostrarChatIA && (
        <ChatIA onClose={() => setMostrarChatIA(false)} />
      )}
    </div>
  )
}

// Estilos 
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-primary)',
    minHeight: 'var(--app-viewport-min-height, 100vh)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '30px',
    backgroundColor: 'var(--bg-secondary)',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  headerTitle: {
    flex: '1 1 200px',
    minWidth: 0,
    overflowWrap: 'anywhere'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: '8px',
    maxWidth: '100%'
  },
  backButton: {
    backgroundColor: 'var(--text-muted)',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '10px'
  },
  chatButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '70px',
    height: '60px',
    borderRadius: '30px',
    background: 'var(--role-gradient)',
    border: 'medium',
    borderStyle: 'none',
    boxShadow: '0 4px 20px var(--shadow-color-hover)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    zIndex: 999,
    flexDirection: 'column',
    gap: '2px',
    marginRight: '10px',
    color: 'white'
  },
  newButton: {
    backgroundColor: 'var(--color-patient)',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
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
    border: '1px solid var(--color-success)'
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
  formContainer: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '30px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  input: {
    padding: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)',
    borderRadius: '6px',
    fontSize: '16px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  select: {
    padding: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)',
    borderRadius: '6px',
    fontSize: '16px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  textarea: {
    padding: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)',
    borderRadius: '6px',
    fontSize: '16px',
    resize: 'vertical',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    minHeight: '80px'
  },
  horariosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '10px',
    marginTop: '10px'
  },
  horaButton: {
    padding: '10px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: '5px',
    cursor: 'pointer',
    textAlign: 'center',
    color: 'var(--text-primary)'
  },
  horaButtonSelected: {
    backgroundColor: 'var(--color-patient)',
    color: 'white',
    border: 'none'
  },
  noHorarios: {
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginTop: '10px'
  },
  submitButton: {
    backgroundColor: 'var(--color-patient)',
    color: 'white',
    padding: '15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '20px'
  },
  citasContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
    gap: '20px'
  },
  section: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  emptyState: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    padding: '40px',
    fontStyle: 'italic'
  },
  citaCard: {
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    marginBottom: '15px',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-tertiary)'
  },
  citaCardHistorial: {
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    marginBottom: '15px',
    overflow: 'hidden',
    opacity: 0.8,
    backgroundColor: 'var(--bg-tertiary)'
  },
  citaHeader: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '10px 15px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  citaDoctor: {
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: 'var(--text-primary)'
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '12px',
    textTransform: 'capitalize',
    color: 'white'
  },
  citaBody: {
    padding: '15px',
    color: 'var(--text-primary)'
  },
  citaFooter: {
    padding: '10px 15px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    backgroundColor: 'var(--color-cancelled)',
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px'
  },
  loading: {
    textAlign: 'center',
    fontSize: '20px',
    marginTop: '50px',
    color: 'var(--color-patient)'
  },
  loadingSmall: {
    textAlign: 'center',
    padding: '10px',
    color: 'var(--text-muted)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '30px',
    borderRadius: '15px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)'
  },
  modalTitle: {
    fontSize: '20px',
    color: 'var(--text-primary)',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--border-color)'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px'
  },
  autocompleteContainer: {
    position: 'relative'
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'var(--bg-secondary)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)',
    borderRadius: '6px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: 'var(--box-shadow)'
  },
  suggestionItem: {
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--border-color)',
    transition: 'background-color 0.2s'
  },
  suggestionName: {
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  suggestionUsername: {
    color: 'var(--text-muted)',
    fontSize: '12px'
  },
  suggestionSpecialty: {
    color: 'var(--text-muted)',
    fontSize: '12px'
  },
  profilePhoto: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    marginRight: '10px',
    objectFit: 'cover'
  },
  noResults: {
    padding: '10px',
    textAlign: 'center',
    color: 'var(--text-muted)'
  },
  fieldHint: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '4px'
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
   saveButton: {
     backgroundColor: 'var(--color-success)',
     color: 'white',
     padding: '12px',
     border: 'none',
     borderRadius: '6px',
     cursor: 'pointer',
     flex: 2,
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     gap: '5px',
     fontSize: '14px',
     fontWeight: '500'
   },
   modalCancelButton: {
     backgroundColor: 'var(--color-cancelled)',
     color: 'white',
     padding: '12px',
     border: 'none',
     borderRadius: '6px',
     cursor: 'pointer',
     flex: 1,
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     gap: '5px',
     fontSize: '14px',
     fontWeight: '500'
   },

 }

export default Citas