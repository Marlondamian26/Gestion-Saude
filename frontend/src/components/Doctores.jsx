import React, { useEffect, useState, useRef } from 'react'
import axiosInstance from '../services/auth'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { FaPhone, FaEnvelope, FaCalendarAlt } from 'react-icons/fa'

function Doctores() {
  const { t } = useLanguage()
  const [especialistas, setEspecialistas] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [especialistaSeleccionado, setEspecialistaSeleccionado] = useState(null)
  const [horarios, setHorarios] = useState([])
  const navigate = useNavigate()
  const modalTitleRef = useRef(null)

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && especialistaSeleccionado) {
        cerrarModal()
      }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [especialistaSeleccionado])

  useEffect(() => {
    fetchEspecialistas()
    fetchEspecialidades()
  }, [])

  const fetchEspecialistas = async () => {
    try {
      const response = await axiosInstance.get('especialistas-publicos/')
      const especialistasData = Array.isArray(response.data) ? response.data : response.data.results || []
      setEspecialistas(especialistasData)
    } catch (error) {
      console.error('Error cargando especialistas:', error)
      setEspecialistas([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEspecialidades = async () => {
    try {
      const response = await axiosInstance.get('especialidades-publicas/')
      const especialidadesData = Array.isArray(response.data) ? response.data : response.data.results || []
      setEspecialidades(especialidadesData)
    } catch (error) {
      console.error('Error cargando especialidades:', error)
      setEspecialidades([])
    }
  }

  const fetchHorarios = async (doctorId) => {
    try {
      const response = await axiosInstance.get(`horarios/?doctor=${doctorId}`)
      const horariosData = Array.isArray(response.data) ? response.data : []
      setHorarios(horariosData)
    } catch (error) {
      console.error('Error cargando horarios:', error)
      setHorarios([])
    }
  }

  const verDetalles = (especialista) => {
    setEspecialistaSeleccionado(especialista)
    if (especialista.tipo === 'doctor') {
      fetchHorarios(especialista.id)
    } else {
      setHorarios([])
    }
  }

  const cerrarModal = () => {
    setEspecialistaSeleccionado(null)
    setHorarios([])
  }

  const diasSemana = [
    t('monday'),
    t('tuesday'),
    t('wednesday'),
    t('thursday'),
    t('friday'),
    t('saturday'),
    t('sunday')
  ]

  // Función para obtener el nombre de la especialidad
  const getEspecialidadNombre = (doctor) => {
    if (doctor.especialidad_nombre) {
      return doctor.especialidad_nombre
    } else if (doctor.otra_especialidad) {
      return `${doctor.otra_especialidad} ✏️`
    }
    return t('notSpecified')
  }

  // Filtrar especialistas por especialidad (usando el nombre para la comparación)
  const especialistasArray = Array.isArray(especialistas) ? especialistas : []
  const especialistasFiltrados = filtroEspecialidad
    ? especialistasArray.filter(e => {
        const espNombre = e.especialidad_nombre || e.otra_especialidad
        return espNombre === filtroEspecialidad
      })
    : especialistasArray

  if (loading) {
    return <div style={styles.loading}>{t('loading')}</div>
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1>👨‍⚕️ {t('ourSpecialists')}</h1>
        <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
          ← {t('back')}
        </button>
      </div>

      {/* Filtros */}
      <div style={styles.filtros}>
        <label style={styles.filtroLabel}>{t('filterBySpecialty')}:</label>
        <select 
          value={filtroEspecialidad} 
          onChange={(e) => setFiltroEspecialidad(e.target.value)}
          style={styles.filtroSelect}
        >
          <option value="">{t('allSpecialties')}</option>
          {especialidades.map(esp => (
            <option key={esp.id} value={esp.nombre}>{esp.nombre}</option>
          ))}
        </select>
      </div>

      {/* Grid de especialistas */}
      <div style={styles.grid}>
        {especialistasFiltrados.map(especialista => {
          const isNurse = especialista.tipo === 'nurse'
          const labelPrefix = isNurse ? t('nurseShort') : t('dr')

          return (
            <div key={especialista.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <img
                  src={especialista.usuario?.foto_perfil_url || 'https://via.placeholder.com/100'}
                  alt={especialista.usuario?.first_name}
                  style={styles.avatar}
                />
                <h3 style={styles.doctorName}>
                  {labelPrefix} {especialista.usuario?.first_name} {especialista.usuario?.last_name}
                </h3>
              </div>
              
              <div style={styles.cardBody}>
                <p style={styles.especialidad}>
                  <strong>🔬 {getEspecialidadNombre(especialista)}</strong>
                </p>
                <p style={styles.biografia}>
                  {especialista.biografia?.substring(0, 100) || t('notSpecified')}
                </p>
              </div>
              
              <div style={styles.cardFooter}>
                <button 
                  onClick={() => verDetalles(especialista)}
                  style={styles.verMasButton}
                >
                  {t('viewAvailability')}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de detalles del especialista */}
      {especialistaSeleccionado && (
        <div style={styles.modalOverlay} onClick={cerrarModal}
             role="dialog" aria-modal="true" aria-labelledby="doctores-modal-title">
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={cerrarModal}>×</button>
            
            <div style={styles.modalHeader}>
              <img
                src={especialistaSeleccionado.usuario?.foto_perfil_url || 'https://via.placeholder.com/150'}
                alt={especialistaSeleccionado.usuario?.first_name}
                style={styles.modalAvatar}
              />
              <div>
                <h2 id="doctores-modal-title" ref={modalTitleRef}>
                  {especialistaSeleccionado.tipo === 'nurse' ? t('nurseShort') : t('dr')} {especialistaSeleccionado.usuario?.first_name} {especialistaSeleccionado.usuario?.last_name}
                </h2>
                <p style={styles.modalEspecialidad}>{getEspecialidadNombre(especialistaSeleccionado)}</p>
              </div>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalSection}>
                <h4>{t('professionalInfo')}</h4>
                <p><strong>{t('biography')}:</strong> {especialistaSeleccionado.biografia || t('notSpecified')}</p>
              </div>

              <div style={styles.modalSection}>
                <h4>📞 {t('contact')}</h4>
                <p><FaPhone /> {especialistaSeleccionado.usuario?.telefono || t('notSpecified')}</p>
                <p><FaEnvelope /> {especialistaSeleccionado.usuario?.email || t('notSpecified')}</p>
              </div>

              <div style={styles.modalSection}>
                <h4>{t('officeHours')}</h4>
                {horarios.length > 0 ? (
                  <div style={styles.horariosGrid}>
                    {horarios.map(horario => (
                      <div key={horario.id} style={styles.horarioItem}>
                        <strong>{diasSemana[horario.dia_semana]}:</strong>
                        <span>{horario.hora_inicio} - {horario.hora_fin}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{t('noScheduleConfigured')}</p>
                )}
              </div>

              {especialistaSeleccionado.tipo === 'doctor' && (
                <button 
                  style={styles.reservarButton}
                  onClick={() => {
                    cerrarModal()
                    navigate('/citas', { state: { doctorSeleccionado: especialistaSeleccionado } })
                  }}
                >
                  <FaCalendarAlt /> {t('bookAppointmentBtn')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {especialistasFiltrados.length === 0 && !loading && (
        <div style={styles.noResults}>
          {t('noSpecialistsFound')} {filtroEspecialidad && `${t('withSpecialty')} "${filtroEspecialidad}"`}
        </div>
      )}
    </div>
  )
}

// Estilos (se mantienen igual, solo eliminamos la referencia a colegiado si existía en estilos)
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'var(--bg-primary)',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    backgroundColor: 'var(--bg-secondary)',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  backButton: {
    backgroundColor: 'var(--text-muted)',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  filtros: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '30px',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)'
  },
  filtroLabel: {
    marginRight: '10px',
    fontWeight: 'bold',
    color: 'var(--text-primary)'
  },
  filtroSelect: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    fontSize: '16px',
    minWidth: '200px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: 'var(--box-shadow)',
    border: '1px solid var(--border-color)',
    transition: 'transform 0.3s'
  },
  cardHeader: {
    backgroundColor: 'var(--color-doctor)',
    color: 'white',
    padding: '20px',
    textAlign: 'center'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '4px solid white',
    marginBottom: '10px'
  },
  doctorName: {
    margin: '0',
    fontSize: '18px',
    color: 'white'
  },
  cardBody: {
    padding: '20px',
    color: 'var(--text-primary)'
  },
  especialidad: {
    color: 'var(--color-doctor)',
    marginBottom: '10px'
  },
  biografia: {
    color: 'var(--text-primary)',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  cardFooter: {
    padding: '20px',
    borderTop: '1px solid var(--border-color)',
    textAlign: 'center'
  },
  verMasButton: {
    backgroundColor: 'var(--color-doctor)',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '14px'
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
    borderRadius: '10px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative',
    border: '1px solid var(--border-color)'
  },
  modalClose: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: 'var(--text-muted)'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px'
  },
  modalAvatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid var(--color-doctor)'
  },
  modalEspecialidad: {
    color: 'var(--color-doctor)',
    fontSize: '16px',
    marginTop: '5px'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    color: 'var(--text-primary)'
  },
  modalSection: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '20px'
  },
  horariosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginTop: '10px'
  },
  horarioItem: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '8px',
    borderRadius: '5px',
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)'
  },
  reservarButton: {
    backgroundColor: 'var(--color-doctor)',
    color: 'white',
    padding: '15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '20px'
  },
  loading: {
    textAlign: 'center',
    fontSize: '20px',
    marginTop: '50px',
    color: 'var(--color-doctor)'
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '10px',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-color)'
  }
}

export default Doctores