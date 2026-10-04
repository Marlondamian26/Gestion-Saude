import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance, { wakeUpBackend } from '../services/auth';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { APP_NAME, API_BASE_URL } from '../config/constants';

const NotificacionesContext = createContext();

export const useNotificaciones = () => {
  const context = useContext(NotificacionesContext);
  if (!context) {
    throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider');
  }
  return context;
};

export const NotificacionesProvider = ({ children }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [sseActive, setSSEActive] = useState(false);

  const { user } = useAuth();
  const { language, t } = useLanguage();

  // SSE state
  const sseRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const useSSERef = useRef(true);

  // Función para traducir y procesar notificaciones
  const procesarNotificacion = (notif, t) => {
    const datosMsg = notif.mensaje ? notif.mensaje.split('|') : [];

    // Mapeo de títulos a traducciones y formato
    const traducciones = {
      'nueva_cita_creada': {
        titulo: t('notifications.appointmentCreated') || 'Nueva Cita Creada',
        template: (datos) => `${t('notifications.yourAppointmentWith')} ${datos[1]} ${t('notifications.onTheDate')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]}.`
      },
      'nueva_cita_para_doctor': {
        titulo: t('notifications.newAppointmentForDoctor') || 'Nueva Cita Agendada',
        template: (datos) => `${t('notifications.newAppointmentFromPatient')} ${datos[1]} ${t('notifications.onTheDate')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]}.`
      },
      'cita_confirmada_paciente': {
        titulo: t('notifications.appointmentConfirmed') || 'Cita Confirmada',
        template: (datos) => `${t('notifications.yourAppointmentWith')} ${datos[1]} ${t('notifications.onTheDate')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]} ${t('notifications.hasBeenConfirmed')}.`
      },
      'cita_confirmada_doctor': {
        titulo: t('notifications.patientConfirmedAppointment') || 'Paciente Confirmó Cita',
        template: (datos) => `${t('notifications.thePatient')} ${datos[1]} ${t('notifications.confirmedTheirAppointmentFor')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]}.`
      },
      'cita_cancelada_por_paciente_paciente': {
        titulo: t('notifications.appointmentCancelled') || 'Cita Cancelada',
        template: (datos) => `${t('notifications.yourAppointmentWith')} ${datos[1]} ${t('notifications.fromTheDate')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]} ${t('notifications.hasBeenCancelled')}.`
      },
      'cita_cancelada_por_paciente_doctor': {
        titulo: t('notifications.patientCancelledAppointment') || 'Cita Cancelada por Paciente',
        template: (datos) => `${t('notifications.thePatient')} ${datos[1]} ${t('notifications.cancelledTheirAppointmentFrom')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]}.`
      },
      'cita_cancelada_por_admin_paciente': {
        titulo: t('notifications.appointmentCancelledByAdmin') || 'Cita Cancelada',
        template: (datos) => `${t('notifications.yourAppointmentWith')} ${datos[1]} ${t('notifications.fromTheDate')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]} ${t('notifications.hasBeenCancelled')}.`
      },
      'cita_cancelada_por_admin_doctor': {
        titulo: t('notifications.appointmentCancelledByAdminDoctor') || 'Cita Cancelada por Administrador',
        template: (datos) => `${t('notifications.theAppointmentOfPatient')} ${datos[1]} ${t('notifications.fromTheDate')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]} ${t('notifications.hasBeenCancelledByAdmin')}.`
      },
      'cita_pospuesta_por_paciente_paciente': {
        titulo: t('notifications.appointmentPostponed') || 'Cita Reprogramada',
        template: (datos) => `${t('notifications.yourAppointmentWith')} ${datos[1]} ${t('notifications.hasBeenRescheduledFrom')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]} ${t('notifications.to')} ${datos[4]} ${t('notifications.atTime')} ${datos[5]}.`
      },
      'cita_pospuesta_por_paciente_doctor': {
        titulo: t('notifications.patientPostponedAppointment') || 'Cita Reprogramada por Paciente',
        template: (datos) => `${t('notifications.thePatient')} ${datos[1]} ${t('notifications.rescheduledTheirAppointmentFrom')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]} ${t('notifications.to')} ${datos[4]} ${t('notifications.atTime')} ${datos[5]}.`
      },
      'cita_pospuesta_por_doctor_paciente': {
        titulo: t('notifications.appointmentPostponedByDoctor') || 'Cita Reprogramada por Doctor',
        template: (datos) => `${t('notifications.yourAppointmentWith')} ${datos[1]} ${t('notifications.hasBeenRescheduledFrom')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]} ${t('notifications.to')} ${datos[4]} ${t('notifications.atTime')} ${datos[5]}.`
      },
      'cita_pospuesta_por_admin_paciente': {
        titulo: t('notifications.appointmentPostponedByAdmin') || 'Cita Reprogramada por Administrador',
        template: (datos) => `${t('notifications.yourAppointmentWith')} ${datos[1]} ${t('notifications.hasBeenRescheduledFrom')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]} ${t('notifications.to')} ${datos[4]} ${t('notifications.atTime')} ${datos[5]}.`
      },
      'cita_pospuesta_por_admin_doctor': {
        titulo: t('notifications.appointmentPostponedByAdminDoctor') || 'Cita Reprogramada por Administrador',
        template: (datos) => `${t('notifications.theAppointmentOfPatient')} ${datos[1]} ${t('notifications.hasBeenRescheduledFrom')} ${datos[2]} ${t('notifications.atTime')} ${datos[3]} ${t('notifications.to')} ${datos[4]} ${t('notifications.atTime')} ${datos[5]} ${t('notifications.byAdmin')}.`
      },
      'nuevo_usuario_registrado_admin': {
        titulo: t('notifications.newUserRegistered') || 'Nuevo Usuario Registrado',
        template: (datos) => `${t('notifications.aNew')} ${datos[1]} ${t('notifications.wasRegistered')}: ${datos[0]}.`
      },
      'imagen_perfil_actualizada_admin': {
        titulo: t('notifications.profileImageUpdated') || 'Imagen de Perfil Actualizada',
        template: (datos) => `${datos[0]} (${datos[1]}) ${t('notifications.updatedTheirProfilePhoto')}.`
      },
      'horarios_actualizado_admin': {
        titulo: t('notifications.scheduleUpdated') || 'Horarios Actualizados',
        template: (datos) => `${datos[0]} (${datos[1]}) ${t('notifications.updatedTheirSchedule')}.`
      },
      'horarios_creada_admin': {
        titulo: t('notifications.scheduleCreated') || 'Nuevo Horario Creado',
        template: (datos) => `${t('notifications.aNewScheduleWasCreatedFor')} ${datos[0]} (${datos[1]}).`
      },
      'especialidad_creada_admin': {
        titulo: t('notifications.specialtyCreated') || 'Nueva Especialidad Creada',
        template: (datos) => `${t('notifications.theSpecialtyWasCreated')}: ${datos[0]}`
      },
      'especialidad_actualizada_admin': {
        titulo: t('notifications.specialtyUpdated') || 'Especialidad Actualizada',
        template: (datos) => `${t('notifications.theSpecialtyWasUpdated')}: ${datos[0]}`
      },
      'imagen_sitio_añadida_admin': {
        titulo: t('notifications.siteImageAdded') || 'Imagen del Sitio Añadida',
        template: (datos) => `${t('notifications.theImageWasAdded')}: ${datos[0]}`
      },
      'imagen_sitio_actualizada_admin': {
        titulo: t('notifications.siteImageUpdated') || 'Imagen del Sitio Actualizada',
        template: (datos) => `${t('notifications.theImageWasUpdated')}: ${datos[0]}`
      },
      'imagen_sitio_eliminada_admin': {
        titulo: t('notifications.siteImageDeleted') || 'Imagen del Sitio Eliminada',
        template: (datos) => `${t('notifications.theImageWasDeleted')}: ${datos[0]}`
      }
    };

    const config = traducciones[notif.titulo] || {
      titulo: notif.titulo,
      template: (datos) => notif.mensaje
    };

    return {
      ...notif,
      titulo_traducido: config.titulo,
      mensaje_traducido: config.template(datosMsg)
    };
  };

  // Cargar notificaciones iniciales
  const cargarNotificaciones = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      await wakeUpBackend();
      const response = await axiosInstance.get('notificaciones/');
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Procesar notificaciones con traducción
      const notificacionesProcesadas = data.map(notif => procesarNotificacion(notif, t));
      setNotificaciones(notificacionesProcesadas);
      
      const noLeidasCount = notificacionesProcesadas.filter(n => !n.leida).length;
      setNoLeidas(noLeidasCount);
      
      // Actualizar el título del documento con el contador
      if (noLeidasCount > 0) {
       document.title = `(${noLeidasCount}) ${APP_NAME}`;
      } else {
       document.title = APP_NAME;
      }
      
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [user, language]);

  // SSE connection management
  const connectSSE = useCallback(() => {
    if (!user?.id || !useSSERef.current) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('[Notificaciones] No access token, falling back to polling');
      setSSEActive(false);
      return;
    }

    try {
      const sseUrl = `${API_BASE_URL}/notificaciones/stream/?token=${token}`;
      const eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        reconnectAttemptsRef.current = 0;

        if (event.data === 'keepalive') return;

        try {
          const raw = JSON.parse(event.data);
          if (raw.error) {
            console.error('[SSE] Server error:', raw.error);
            return;
          }

          // Procesar como una nueva notificación
          const notif = procesarNotificacion(raw, t);
          setNotificaciones(prev => {
            // Evitar duplicados (mismo id)
            if (prev.some(n => n.id === raw.id)) return prev;
            const updated = [notif, ...prev];
            const noLeidasCount = updated.filter(n => !n.leida).length;
            setNoLeidas(noLeidasCount);
            if (noLeidasCount > 0) {
              document.title = `(${noLeidasCount}) ${APP_NAME}`;
            }
            return updated;
          });
        } catch (e) {
          console.error('[SSE] Error parsing event:', e);
        }
      };

      eventSource.onerror = (err) => {
        reconnectAttemptsRef.current += 1;
        console.warn(`[SSE] Connection error (attempt ${reconnectAttemptsRef.current})`);

        if (reconnectAttemptsRef.current >= 3) {
          console.warn('[SSE] Falling back to polling');
          setSSEActive(false);
          eventSource.close();
          return;
        }

        // Exponential backoff: 5s, 10s, 20s
        const delay = Math.min(5000 * Math.pow(2, reconnectAttemptsRef.current - 1), 20000);
        setTimeout(() => {
          if (useSSERef.current && user?.id) {
            connectSSE();
          }
        }, delay);
      };

      sseRef.current = eventSource;
      setSSEActive(true);
      console.log('[SSE] Connected to notificaciones stream');
    } catch (e) {
      console.error('[SSE] Failed to connect:', e);
      setSSEActive(false);
    }
  }, [user, t, language]);

  // Configurar polling cada 60 segundos (fallback / complemento a SSE)
  useEffect(() => {
    if (!user) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    // Cargar inicial
    cargarNotificaciones();

    // Configurar polling (60s + pausa en pestaña oculta)
    let interval;
    let isPaused = false;

    const pausarSiOculto = () => {
      if (document.hidden) {
        isPaused = true;
      }
    };

    const reanudarSiVisible = () => {
      if (!document.hidden && isPaused) {
        isPaused = false;
        cargarNotificaciones();
      }
    };

    interval = setInterval(() => {
      if (!isPaused) {
        cargarNotificaciones();
      }
    }, 60000); // 60 segundos

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isPaused = true;
      } else {
        isPaused = false;
        cargarNotificaciones();
      }
    });

    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, cargarNotificaciones]);

  // SSE: conectar al montar, desconectar al unmount o logout
  useEffect(() => {
    if (user && useSSERef.current) {
      connectSSE();
    }

    return () => {
      useSSERef.current = false;
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [user, language]);

  // Marcar una notificación como leída
  const marcarComoLeida = async (id) => {
    const notificacion = notificaciones.find(n => n.id === id);
    if (!notificacion || notificacion.leida) return;
    
    try {
      await axiosInstance.post(`notificaciones/${id}/marcar_leida/`);
      
      // Actualizar estado local
      setNotificaciones(prev =>
        prev.map(n =>
          n.id === id ? { ...n, leida: true } : n
        )
      );

      // Actualizar título del documento
      const noLeidasRestantes = notificaciones.filter(n => n.id !== id && !n.leida).length;
      if (noLeidasRestantes > 0) {
        document.title = `(${noLeidasRestantes}) ${APP_NAME}`;
      } else {
        document.title = APP_NAME;
      }

      setNoLeidas(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Error marcando notificación como leída:', err);
    }
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = async () => {
    try {
      await axiosInstance.post('notificaciones/marcar_todas_leidas/');
      
      setNotificaciones(prev => 
        prev.map(n => ({ ...n, leida: true }))
      );
      setNoLeidas(0);
      
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  };

  // Eliminar una notificación
  const eliminarNotificacion = async (id) => {
    try {
      await axiosInstance.delete(`notificaciones/${id}/`);
      
      const notificacionEliminada = notificaciones.find(n => n.id === id);
      setNotificaciones(prev => prev.filter(n => n.id !== id));
      
      if (notificacionEliminada && !notificacionEliminada.leida) {
        setNoLeidas(prev => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      console.error('Error eliminando notificación:', err);
    }
  };

  return (
     <NotificacionesContext.Provider value={{
      notificaciones,
      noLeidas,
      loading,
      error,
      sseActive,
      cargarNotificaciones,
      marcarComoLeida,
      marcarTodasLeidas,
      eliminarNotificacion
    }}>
      {children}
    </NotificacionesContext.Provider>
  );
};