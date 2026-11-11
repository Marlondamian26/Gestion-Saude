import React, { useEffect, useState, useCallback, useRef } from 'react'
import axiosInstance from '../services/auth'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import PromocionalToggle from './PromocionalToggle';
import ReminderCards from './ReminderCards'
import { 
  FaUserNurse, FaHeartbeat, FaThermometerHalf, FaSyringe, 
  FaBandAid, FaFlask, FaClipboardList, FaCheckCircle,
  FaExclamationTriangle, FaSpinner, FaCalendarAlt, FaUserMd,
  FaNotesMedical, FaVial, FaPills, FaWeight, FaRuler
} from 'react-icons/fa'

function EnfermeriaDashboard() {
  const { t } = useLanguage()
  const [user, setUser] = useState(null)
  const [enfermera, setEnfermera] = useState(null)
  const [pacientesHoy, setPacientesHoy] = useState([])
  const [procedimientosPendientes, setProcedimientosPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Carregando painel de enfermagem...')
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [activeTab, setActiveTab] = useState('pacientes')
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [signosVitales, setSignosVitales] = useState({
    temperatura: '',
    presion_sistolica: '',
    presion_diastolica: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    saturacion_oxigeno: '',
    peso: '',
    talla: '',
    glucosa: '',
    notas: ''
  })
  const [procedimiento, setProcedimiento] = useState({
    tipo: 'curacion',
    descripcion: '',
    materiales: '',
    observaciones: ''
  })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const modalTitleRef = useRef(null)

  // Cerrar modal de signos vitales con tecla Escape
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && selectedPaciente) {
        setSelectedPaciente(null)
      }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [selectedPaciente])

  // Estados para búsqueda de pacientes
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [sugerenciasPacientes, setSugerenciasPacientes] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

  // Función para buscar pacientes
  const buscarPacientes = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSugerenciasPacientes([])
      setMostrarSugerencias(false)
      return
    }

    try {
      const response = await axiosInstance.get('buscar-pacientes/', {
        params: { query }
      })
      setSugerenciasPacientes(response.data.resultados || [])
      setMostrarSugerencias(true)
    } catch (error) {
      console.error('Error buscando pacientes:', error)
      setSugerenciasPacientes([])
    }
  }, [])

  // Función para seleccionar paciente
  const seleccionarPaciente = useCallback((paciente) => {
    setProcedimiento(prev => ({ ...prev, paciente: paciente.id }))
    setBusquedaPaciente(paciente.display_text)
    setMostrarSugerencias(false)
  }, [])

  useEffect(() => {
    checkAccessAndLoadData()
  }, [])

  const checkAccessAndLoadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        navigate('/login')
        return
      }

      // Obtener usuario actual
      const userResponse = await axiosInstance.get('usuario-actual/')
      
      // Verificar que sea enfermera
      if (userResponse.data.rol !== 'nurse') {
        mostrarMensaje(t('unauthorized'), 'error')
        setTimeout(() => navigate('/dashboard'), 2000)
        return
      }

      setUser(userResponse.data)
      
      // Obtener perfil de enfermera
      const enfermerasResponse = await axiosInstance.get('enfermeras/')
      const enfermerasData = Array.isArray(enfermerasResponse.data) ? enfermerasResponse.data : []
      const miPerfil = enfermerasData.find(e => e.usuario?.id === userResponse.data.id)
      
      if (miPerfil) {
        setEnfermera(miPerfil)
      }

      // Cargar datos del día
      await loadTodayData()

    } catch (error) {
      console.error('Error cargando datos:', error)
      mostrarMensaje(t('connectionError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadTodayData = async () => {
    try {
      setLoadingMessage('Carregando pacientes do dia...')
      
      // Obtener citas de hoy
      const hoy = new Date().toISOString().split('T')[0]
      const citasResponse = await axiosInstance.get('citas/', {
        params: { fecha: hoy }
      })
      
      const citasHoy = Array.isArray(citasResponse.data) ? citasResponse.data : []
      
      // Obtener detalles de pacientes
      const pacientesPromises = citasHoy.map(async (cita) => {
        try {
          const pacienteResponse = await axiosInstance.get(`pacientes/${cita.paciente}/`)
          return {
            ...cita,
            pacienteDetalle: pacienteResponse.data
          }
        } catch {
          return cita
        }
      })
      
      const pacientesConDetalle = await Promise.all(pacientesPromises)
      setPacientesHoy(pacientesConDetalle)

      // TODO: Fetch real procedimientos pendientes from API
      setProcedimientosPendientes([])

    } catch (error) {
      console.error('Error cargando datos del día:', error)
    }
  }

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000)
  }

  const handleSignosVitalesChange = (e) => {
    const { name, value } = e.target
    setSignosVitales(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProcedimientoChange = (e) => {
    const { name, value } = e.target
    setProcedimiento(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const registrarSignosVitales = async (pacienteId) => {
    setSaving(true)
    try {
      // Aquí iría la llamada a la API
      console.log('Registrando signos vitales:', { pacienteId, ...signosVitales })
      
      mostrarMensaje(t('vitalsRegistered'), 'success')
      setSignosVitales({
        temperatura: '',
        presion_sistolica: '',
        presion_diastolica: '',
        frecuencia_cardiaca: '',
        frecuencia_respiratoria: '',
        saturacion_oxigeno: '',
        peso: '',
        talla: '',
        glucosa: '',
        notas: ''
      })
      setSelectedPaciente(null)
    } catch (error) {
      console.error('Error registrando signos vitales:', error)
      mostrarMensaje(t('errorSaving', { type: t('vitalSigns').toLowerCase() }), 'error')
    } finally {
      setSaving(false)
    }
  }

  const realizarProcedimiento = async () => {
    setSaving(true)
    try {
      console.log('Realizando procedimiento:', procedimiento)
      mostrarMensaje(t('itemCreated', { type: t('procedures').toLowerCase() }), 'success')
      setProcedimiento({
        tipo: 'curacion',
        descripcion: '',
        materiales: '',
        observaciones: ''
      })
    } catch (error) {
      console.error('Error realizando procedimiento:', error)
      mostrarMensaje(t('errorSaving', { type: t('procedures').toLowerCase() }), 'error')
    } finally {
      setSaving(false)
    }
  }

  const getPrioridadColor = (prioridad) => {
    const colores = {
      alta: '#e74c3c',
      media: '#f39c12',
      baja: '#27ae60'
    }
    return colores[prioridad] || '#95a5a6'
  }

  // Función para obtener el nombre de la especialidad de enfermería
  const getEspecialidadNombre = () => {
    if (!enfermera) return t('generalNursing')
    
    if (enfermera.especialidad_nombre) {
      return enfermera.especialidad_nombre
    } else if (enfermera.otra_especialidad) {
      return `${enfermera.otra_especialidad}`
    }
    return 'Enfermería General'
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <FaSpinner style={styles.loadingSpinner} />
        <p style={styles.loadingText}>{loadingMessage}</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerBar}>
      </div>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            <FaUserNurse style={styles.titleIcon} />
            {t('nursingDashboard')}
          </h1>
          {user?.foto_perfil_url && (
            <img
              src={user.foto_perfil_url}
              alt={`${user.first_name} ${user.last_name}`}
              style={styles.profilePhotoSmall}
            />
          )}
          <p style={styles.subtitle}>
            {t('welcome')}, {user?.first_name} {user?.last_name}
            {enfermera && ` - ${getEspecialidadNombre()}`}
          </p>
          {enfermera?.numero_licencia && (
            <p style={styles.licenciaInfo}>
              <FaClipboardList /> Licencia: {enfermera.numero_licencia}
            </p>
          )}
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

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <FaUserNurse style={styles.statIcon} />
          <div>
            <h3>{t('patientsToday')}</h3>
            <p>{pacientesHoy.length}</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <FaSyringe style={styles.statIcon} />
          <div>
            <h3>{t('procedures')}</h3>
            <p>{procedimientosPendientes.length}</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <FaHeartbeat style={styles.statIcon} />
          <div>
            <h3>Signos Vitales</h3>
            <p>Pendientes: {pacientesHoy.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{...styles.tab, ...(activeTab === 'pacientes' && styles.activeTab)}}
          onClick={() => setActiveTab('pacientes')}
        >
          <FaUserNurse /> {t('patientsOfDayTitle')}
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'procedimientos' && styles.activeTab)}}
          onClick={() => setActiveTab('procedimientos')}
        >
          <FaSyringe /> {t('procedures')}
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'registrar' && styles.activeTab)}}
          onClick={() => setActiveTab('registrar')}
        >
          <FaClipboardList /> {t('registerNew')}
        </button>
      </div>

      {/* Contenido según tab */}
      <div style={styles.content}>
        {/* Tab: {t('patientsOfDayTitle')} */}
        {activeTab === 'pacientes' && (
          <div style={styles.pacientesContainer}>
            <h2>{t('patientsWithAppointmentToday')}</h2>
            {pacientesHoy.length === 0 ? (
              <div style={styles.emptyState}>
                <FaCalendarAlt style={styles.emptyIcon} />
                <p>{t('patientsScheduled')}</p>
              </div>
            ) : (
              <div style={styles.pacientesList}>
                {pacientesHoy.map((cita, index) => (
                  <div key={cita.id || index} style={styles.pacienteCard}>
                    <div style={styles.pacienteHeader}>
                      <div>
                        <h3>{cita.paciente_nombre || `${t('patient')} #${cita.paciente}`}</h3>
                        <p style={styles.pacienteHora}>{cita.hora}</p>
                      </div>
                      <span style={styles.pacienteEstado}>{cita.estado}</span>
                    </div>
                    
                    {cita.motivo && (
                      <p style={styles.pacienteMotivo}>
                        <FaNotesMedical /> {cita.motivo}
                      </p>
                    )}

                    <div style={styles.pacienteAcciones}>
                      <button 
                        style={styles.actionButton}
                        onClick={() => setSelectedPaciente(cita)}
                      >
                        <FaHeartbeat /> {t('registerSigns')}
                      </button>
                      <button style={styles.actionButton}>
                        <FaBandAid /> Realizar Curación
                      </button>
                      <button style={styles.actionButton}>
                        <FaVial /> Tomar Muestra
                      </button>
                    </div>

                    {/* Modal de signos vitales */}
                    {selectedPaciente?.id === cita.id && (
                      <div style={styles.modalOverlay} onClick={() => setSelectedPaciente(null)}
                           role="dialog" aria-modal="true" aria-labelledby="enfermeria-modal-title">
                        <div style={styles.modal} onClick={e => e.stopPropagation()}>
                          <h3 id="enfermeria-modal-title" ref={modalTitleRef}>
                            {t('registerVitalsTitle')}
                          </h3>
                          <p style={styles.modalPaciente}>
                            {t('patient')}: {selectedPaciente?.paciente_nombre}
                          </p>
                          
                          <div style={styles.signosForm}>
                            <div style={styles.formRow}>
                              <div style={styles.formGroup}>
                                <label>Temperatura (°C):</label>
                                <input
                                  type="number"
                                  name="temperatura"
                                  value={signosVitales.temperatura}
                                  onChange={handleSignosVitalesChange}
                                  style={styles.input}
                                  placeholder="36.5"
                                  step="0.1"
                                />
                              </div>
                              <div style={styles.formGroup}>
                                <label>Presión Arterial:</label>
                                <div style={styles.presionGroup}>
                                  <input
                                    type="number"
                                    name="presion_sistolica"
                                    value={signosVitales.presion_sistolica}
                                    onChange={handleSignosVitalesChange}
                                    style={styles.inputSmall}
                                    placeholder="120"
                                  />
                                  <span>/</span>
                                  <input
                                    type="number"
                                    name="presion_diastolica"
                                    value={signosVitales.presion_diastolica}
                                    onChange={handleSignosVitalesChange}
                                    style={styles.inputSmall}
                                    placeholder="80"
                                  />
                                </div>
                              </div>
                            </div>

                            <div style={styles.formRow}>
                              <div style={styles.formGroup}>
                                <label>Frec. Cardíaca (lpm):</label>
                                <input
                                  type="number"
                                  name="frecuencia_cardiaca"
                                  value={signosVitales.frecuencia_cardiaca}
                                  onChange={handleSignosVitalesChange}
                                  style={styles.input}
                                  placeholder="72"
                                />
                              </div>
                              <div style={styles.formGroup}>
                                <label>Frec. Respiratoria:</label>
                                <input
                                  type="number"
                                  name="frecuencia_respiratoria"
                                  value={signosVitales.frecuencia_respiratoria}
                                  onChange={handleSignosVitalesChange}
                                  style={styles.input}
                                  placeholder="16"
                                />
                              </div>
                            </div>

                            <div style={styles.formRow}>
                              <div style={styles.formGroup}>
                                <label>Saturación O2 (%):</label>
                                <input
                                  type="number"
                                  name="saturacion_oxigeno"
                                  value={signosVitales.saturacion_oxigeno}
                                  onChange={handleSignosVitalesChange}
                                  style={styles.input}
                                  placeholder="98"
                                  min="0"
                                  max="100"
                                />
                              </div>
                              <div style={styles.formGroup}>
                                <label>Glucosa (mg/dL):</label>
                                <input
                                  type="number"
                                  name="glucosa"
                                  value={signosVitales.glucosa}
                                  onChange={handleSignosVitalesChange}
                                  style={styles.input}
                                  placeholder="100"
                                />
                              </div>
                            </div>

                            <div style={styles.formRow}>
                              <div style={styles.formGroup}>
                                <label>Peso (kg):</label>
                                <input
                                  type="number"
                                  name="peso"
                                  value={signosVitales.peso}
                                  onChange={handleSignosVitalesChange}
                                  style={styles.input}
                                  placeholder="70"
                                  step="0.1"
                                />
                              </div>
                              <div style={styles.formGroup}>
                                <label>Talla (cm):</label>
                                <input
                                  type="number"
                                  name="talla"
                                  value={signosVitales.talla}
                                  onChange={handleSignosVitalesChange}
                                  style={styles.input}
                                  placeholder="170"
                                />
                              </div>
                            </div>

                            <div style={styles.formGroup}>
                              <label>Notas adicionales:</label>
                              <textarea
                                name="notas"
                                value={signosVitales.notas}
                                onChange={handleSignosVitalesChange}
                                style={styles.textarea}
                                rows="3"
                                placeholder="Observaciones importantes..."
                              />
                            </div>

                            <div style={styles.modalButtons}>
                              <button 
                                onClick={() => registrarSignosVitales(selectedPaciente.paciente)}
                                style={styles.saveButton}
                                disabled={saving}
                              >
                                {saving ? <FaSpinner style={styles.spinner} /> : <FaCheckCircle />}
                                {t('saveVitals')}
                              </button>
                              <button 
                                onClick={() => setSelectedPaciente(null)}
                                style={styles.cancelButton}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: {t('pendingProcedures')} */}
        {activeTab === 'procedimientos' && (
          <div style={styles.procedimientosContainer}>
            <h2>{t('pendingProcedures')}</h2>
            {procedimientosPendientes.length === 0 ? (
              <div style={styles.emptyState}>
                <FaCheckCircle style={styles.emptyIcon} />
                <p>No hay procedimientos pendientes</p>
              </div>
            ) : (
              <div style={styles.procedimientosList}>
                {procedimientosPendientes.map(proc => (
                  <div key={proc.id} style={styles.procedimientoCard}>
                    <div style={styles.procedimientoHeader}>
                      <div style={styles.procedimientoTipo}>
                        {proc.tipo === 'vacuna' && <FaSyringe />}
                        {proc.tipo === 'curacion' && <FaBandAid />}
                        {proc.tipo === 'toma_muestra' && <FaFlask />}
                        <span>{proc.tipo.charAt(0).toUpperCase() + proc.tipo.slice(1)}</span>
                      </div>
                      <span style={{
                        ...styles.prioridadBadge,
                        backgroundColor: getPrioridadColor(proc.prioridad)
                      }}>
                        {proc.prioridad}
                      </span>
                    </div>
                    
                    <p style={styles.procedimientoPaciente}>
                      <strong>{t('patient')}:</strong> {proc.paciente}
                    </p>
                    <p style={styles.procedimientoDescripcion}>
                      {proc.descripcion}
                    </p>

                    <button style={styles.realizarButton}>
                      Realizar Procedimiento
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: {t('registerNew')} */}
        {activeTab === 'registrar' && (
          <div style={styles.registrarContainer}>
            <h2>{t('registerNewProcedure')}</h2>
            
            <div style={styles.registrarForm}>
              <div style={styles.formGroup}>
                <label>Tipo de Procedimiento:</label>
                <select
                  name="tipo"
                  value={procedimiento.tipo}
                  onChange={handleProcedimientoChange}
                  style={styles.select}
                >
                  <option value="curacion">Curación</option>
                  <option value="vacuna">Vacunación</option>
                  <option value="toma_muestra">Toma de Muestra</option>
                  <option value="medicacion">Administración de Medicamentos</option>
                  <option value="control">Control de Signos Vitales</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>{t('patient')}:</label>
                <div style={styles.pacienteBusquedaContainer}>
                  <input
                    type="text"
                    value={busquedaPaciente}
                    onChange={(e) => {
                      setBusquedaPaciente(e.target.value)
                      buscarPacientes(e.target.value)
                    }}
                    placeholder={t('typeToSearchPatient') || 'Escribe el nombre del paciente...'}
                    style={styles.select}
                  />
                  {mostrarSugerencias && sugerenciasPacientes.length > 0 && (
                    <div style={styles.sugerenciasContainer}>
                      {sugerenciasPacientes.map((paciente) => (
                        <button
                          key={paciente.id}
                          style={styles.sugerenciaItem}
                          onClick={() => seleccionarPaciente(paciente)}
                          type="button"
                        >
                          <span>{paciente.display_text}</span>
                          {paciente.foto_perfil && (
                            <img src={paciente.foto_perfil} alt={paciente.display_text} style={styles.pacienteFoto} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {busquedaPaciente.length > 0 && mostrarSugerencias && sugerenciasPacientes.length === 0 && (
                    <div style={styles.sinResultados}>
                      {t('noPatientsFound') || 'No se encontraron pacientes'}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Descripción:</label>
                <textarea
                  name="descripcion"
                  value={procedimiento.descripcion}
                  onChange={handleProcedimientoChange}
                  style={styles.textarea}
                  rows="3"
                  placeholder="Describe el procedimiento a realizar..."
                />
              </div>

              <div style={styles.formGroup}>
                <label>Materiales utilizados:</label>
                <textarea
                  name="materiales"
                  value={procedimiento.materiales}
                  onChange={handleProcedimientoChange}
                  style={styles.textarea}
                  rows="2"
                  placeholder="Ej: gasas, alcohol, jeringa..."
                />
              </div>

              <div style={styles.formGroup}>
                <label>Observaciones:</label>
                <textarea
                  name="observaciones"
                  value={procedimiento.observaciones}
                  onChange={handleProcedimientoChange}
                  style={styles.textarea}
                  rows="2"
                  placeholder="Notas adicionales..."
                />
              </div>

              <button 
                onClick={realizarProcedimiento}
                style={styles.realizarButton}
                disabled={saving}
              >
                {saving ? <FaSpinner style={styles.spinner} /> : <FaCheckCircle />}
                {t('registerProcedure')}
              </button>
            </div>
           </div>
         )}
       </div>
       {pacientesHoy.length > 0 && (
         <div style={{ marginTop: '24px' }}>
           <ReminderCards citas={pacientesHoy} role="nurse" />
         </div>
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
    color: 'var(--color-nurse)',
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
    color: 'var(--color-nurse)'
  },
  profilePhotoSmall: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--color-nurse)',
    marginTop: '10px'
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    margin: 0
  },
  licenciaInfo: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: '5px 0 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    color: 'var(--text-primary)'
  },
  statIcon: {
    fontSize: '32px',
    color: 'var(--color-nurse)'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '12px 20px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    transition: 'all 0.3s'
  },
  activeTab: {
    backgroundColor: 'var(--color-nurse)',
    color: 'white',
    borderColor: 'var(--color-nurse)'
  },
  content: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)',
    minHeight: '400px'
  },
  pacientesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  pacientesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  pacienteCard: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)'
  },
  pacienteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  pacienteHora: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '5px'
  },
  pacienteEstado: {
    padding: '4px 8px',
    backgroundColor: 'var(--color-nurse)',
    color: 'white',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500'
  },
  pacienteMotivo: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'var(--bg-secondary)',
    padding: '8px',
    borderRadius: '6px'
  },
  pacienteAcciones: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  actionButton: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    border: '1px solid var(--color-nurse)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
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
    border: '1px solid var(--border-color)'
  },
  modalPaciente: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '20px'
  },
  signosForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  input: {
    padding: '8px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    fontSize: '16px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  inputSmall: {
    width: '70px',
    padding: '8px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    fontSize: '16px',
    textAlign: 'center',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  presionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  textarea: {
    padding: '8px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    fontSize: '16px',
    resize: 'vertical',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  select: {
    padding: '8px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    fontSize: '16px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  saveButton: {
    backgroundColor: 'var(--color-success)',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  cancelButton: {
    backgroundColor: 'var(--color-cancelled)',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    flex: 1
  },
  procedimientosContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  procedimientosList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px'
  },
  procedimientoCard: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)'
  },
  procedimientoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  procedimientoTipo: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  prioridadBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  procedimientoPaciente: {
    fontSize: '13px',
    marginBottom: '5px'
  },
  procedimientoDescripcion: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '10px'
  },
  realizarButton: {
    backgroundColor: 'var(--color-nurse)',
    color: 'white',
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  registrarContainer: {
    maxWidth: '600px',
    margin: '0 auto'
  },
  registrarForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-muted)'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '10px',
    color: 'var(--text-muted)'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  pacienteBusquedaContainer: {
    position: 'relative'
  },
  sugerenciasContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  sugerenciaItem: {
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border-color)',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background 0.2s',
    color: 'var(--text-primary)'
  },
  pacienteFoto: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  sinResultados: {
    padding: '10px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '13px'
  }
}

// Añadir animación de spin
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(styleSheet)

export default EnfermeriaDashboard