/**
 * useChatIA.js — Hook que encapsula toda la lógica de estado y negocio del
 * Asistente de citas (antes "ChatIA", nombre técnico conservado por compatibilidad).
 * Extraído de ChatIA.jsx (§4.1.2). La máquina de estados y todas las funciones
 * de negocio viven aquí; los componentes solo consumen el estado y llaman handlers.
 *
 * NOTA (FASE 12): el asistente es un chatbot basado en reglas y máquina de
 * estados, no utiliza IA. La arquitectura está preparada para integración futura.
 *
 * Políticas (heredadas del signal §3.4 y validación §3.3):
 * - P1: rol='patient' crea Paciente automáticamente (backend).
 * - P2: admin/doctor pueden seleccionar paciente para gestionar citas ajenas.
 * - P3: citas canceladas no bloquean slots (unique constraint condicional en backend).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import chatService from '../services/chatService';

const useChatIA = () => {
  const { t, language } = useLanguage();
  const chatEndRef = useRef(null);

  // Estado de la máquina de estados
  const [estado, setEstado] = useState('inicio');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState([]);
  const [opciones, setOpciones] = useState([]);
  const [datos, setDatos] = useState({
    especialidad: null,
    doctor: null,
    fecha: null,
    hora: null,
    paciente: null,
  });

  const [especialidades, setEspecialidades] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horariosSemana, setHorariosSemana] = useState([]);
  const messageIdRef = useRef(0);

  // Estados para selección de pacientes
  const [userRole, setUserRole] = useState(null);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [sugerenciasPacientes, setSugerenciasPacientes] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [accionCita, setAccionCita] = useState(null);

  // Estados para cancelar/posponer
  const [citasDisponibles, setCitasDisponibles] = useState([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState(null);
  const [nuevaHora, setNuevaHora] = useState(null);
  const [horariosNuevos, setHorariosNuevos] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);

  const agregarMensaje = useCallback((texto, tipo = 'ia') => {
    messageIdRef.current += 1;
    const newId = messageIdRef.current;
    setHistorial((prev) => [...prev, { id: newId, tipo, texto, timestamp: new Date() }]);
  }, []);

  const inicializar = useCallback(async (resetChat = false) => {
    if (resetChat) {
      setHistorial([]);
      setEstado('inicio');
      setDatos({ especialidad: null, doctor: null, fecha: null, hora: null, paciente: null });
      messageIdRef.current = 0;
    }
    setLoading(true);
    try {
      if (!userRole) {
        const usuario = await chatService.getUsuarioActual();
        setUserRole(usuario.rol);
      }
      const [espData, docData] = await Promise.all([
        chatService.getEspecialidades(),
        chatService.getDoctores(),
      ]);
      setEspecialidades(espData);
      setDoctores(docData);
      setOpciones([
        { id: 'agendar', texto: t('scheduleAppointment') },
        { id: 'mis_citas', texto: t('myAppointments') },
        { id: 'cancelar_cita', texto: t('cancelAppointmentOption') },
        { id: 'posponer', texto: t('postponeAppointmentOption') },
        { id: 'ayuda', texto: t('needHelp') },
      ]);
    } catch (error) {
      console.error('Error inicializando:', error);
    } finally {
      setLoading(false);
    }
  }, [t, userRole]);

  const cargarHorariosSemana = useCallback(async (doctorId) => {
    try {
      const dias = await chatService.getHorariosSemana(doctorId);
      setHorariosSemana(dias);
      return dias;
    } catch (error) {
      console.error('Error fetching horarios semana:', error);
      setHorariosSemana([]);
      return [];
    }
  }, []);

  const buscarPacientes = useCallback((query) => {
    setBusquedaPaciente(query);
    setMostrarSugerencias(false);
  }, []);

  useEffect(() => {
    if (!busquedaPaciente || busquedaPaciente.length < 2) {
      setSugerenciasPacientes([]);
      setMostrarSugerencias(false);
      return;
    }
    const timer = setTimeout(() => {
      chatService.buscarPacientes(busquedaPaciente)
        .then((resultados) => {
          setSugerenciasPacientes(resultados);
          setMostrarSugerencias(true);
        })
        .catch((error) => {
          console.error('Error buscando pacientes:', error);
          setSugerenciasPacientes([]);
          setMostrarSugerencias(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaPaciente]);

  const seleccionarPaciente = useCallback(async (paciente) => {
    setDatos((prev) => ({ ...prev, paciente }));
    setBusquedaPaciente(paciente.display_text);
    setMostrarSugerencias(false);
    agregarMensaje(paciente.display_text, 'usuario');

    if (estado === 'elegir_paciente_accion') {
      if (accionCita) {
        await mostrarCitasParaAccion(accionCita, paciente.id);
      }
      setAccionCita(null);
      return;
    }

    agregarMensaje(t('whatSpecialty'));
    setEstado('elegir_especialidad');
    setOpciones(especialidades.map((esp) => ({
      id: esp.id,
      texto: esp.nombre,
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [especialidades, agregarMensaje, t, estado, accionCita]);

  const seleccionarOpcion = useCallback(async (opcionId) => {
    const opcionIdStr = String(opcionId);

    agregarMensaje(
      opciones.find((o) => String(o.id) === opcionIdStr)?.texto || opcionId,
      'usuario'
    );
    setLoading(true);

    try {
      if (estado === 'elegir_especialidad') {
        const opcionIdNum = Number(opcionId);
        const esp = !isNaN(opcionIdNum)
          ? especialidades.find(
              (e) =>
                Number(e.id) === opcionIdNum ||
                e.nombre.toLowerCase().includes(opcionIdStr.toLowerCase())
            )
          : especialidades.find((e) =>
              e.nombre.toLowerCase().includes(opcionIdStr.toLowerCase())
            );
        if (esp) {
          setDatos((prev) => ({ ...prev, especialidad: esp }));
          const doctoresFiltrados = doctores.filter(
            (d) =>
              d.especialidad === esp.id ||
              d.especialidad_nombre === esp.nombre
          );
          if (doctoresFiltrados.length === 0) {
            agregarMensaje(`${t('noDoctorsAvailable')} ${esp.nombre}.`);
            agregarMensaje(t('chooseSpecialty'));
            setLoading(false);
            return;
          } else {
            agregarMensaje(t('whichDoctor'));
            setEstado('elegir_doctor');
            setOpciones(
              doctoresFiltrados.map((d) => ({
                id: d.id,
                texto: `Dr. ${d.usuario?.first_name} ${d.usuario?.last_name} - ${d.especialidad_nombre || d.otra_especialidad}`,
              }))
            );
            setLoading(false);
            return;
          }
        }
      }

      if (estado === 'elegir_doctor') {
        const opcionIdNum = Number(opcionId);
        const doctor = doctores.find((d) => Number(d.id) === opcionIdNum);
        if (doctor) {
          setDatos((prev) => ({ ...prev, doctor }));
          setLoading(true);
          try {
            const dias = await cargarHorariosSemana(doctor.id);
            agregarMensaje(t('whatDate'));
            const opcionesFecha = [];
            const hoy = new Date();
            const diaHoy = (hoy.getDay() + 6) % 7;
            if (dias.includes(diaHoy)) {
              opcionesFecha.push({ id: 'hoy', texto: t('today') });
            }
            const manana = new Date(hoy);
            manana.setDate(manana.getDate() + 1);
            const diaManana = (manana.getDay() + 6) % 7;
            if (dias.includes(diaManana)) {
              opcionesFecha.push({ id: 'manana', texto: t('tomorrow') });
            }
            opcionesFecha.push({ id: 'otra', texto: t('otherDate') });
            setEstado('elegir_fecha');
            setOpciones(opcionesFecha);
          } catch (error) {
            console.error('Error fetching horarios:', error);
            agregarMensaje('Error al cargar horarios del doctor');
            setEstado('elegir_doctor');
            const doctoresFiltrados = doctores.filter(
              (d) =>
                d.especialidad === datos.especialidad.id ||
                d.especialidad_nombre === datos.especialidad.nombre
            );
            setOpciones(
              doctoresFiltrados.map((d) => ({
                id: d.id,
                texto: `Dr. ${d.usuario?.first_name} ${d.usuario?.last_name} - ${d.especialidad_nombre || d.otra_especialidad}`,
              }))
            );
          } finally {
            setLoading(false);
          }
          return;
        }
      }

      // Manejar estados específicos antes del switch
      if (estado === 'elegir_fecha') {
        if (opcionId === 'hoy') {
          const hoy = new Date().toISOString().split('T')[0];
          setDatos((prev) => ({ ...prev, fecha: hoy }));
          await cargarHorarios(datos.doctor?.id, hoy);
          return;
        } else if (opcionId === 'manana') {
          const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          setDatos((prev) => ({ ...prev, fecha: manana }));
          await cargarHorarios(datos.doctor?.id, manana);
          return;
        } else if (opcionId === 'otra') {
          const mesesOptions = generarMesesOptions();
          agregarMensaje(t('selectMonth'));
          setEstado('elegir_mes');
          setOpciones(mesesOptions);
          return;
        }
      }

      if (estado === 'elegir_mes') {
        setMesSeleccionado(opcionId);
        const [anioMes, mesNum] = opcionId.split('-');
        const diasOptions = generarDiasOptions(parseInt(anioMes), parseInt(mesNum));
        agregarMensaje(t('selectDay'));
        setEstado('elegir_dia');
        setOpciones(diasOptions);
        return;
      }

      if (estado === 'elegir_dia') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(opcionId)) {
          if (citaSeleccionada) {
            const citaDoctor = citaSeleccionada.doctor || citaSeleccionada.doctor_id;
            const doctorId = typeof citaDoctor === 'object' ? citaDoctor.id : citaDoctor;
            setNuevaFecha(opcionId);
            await cargarHorariosNuevos(doctorId, opcionId);
          } else {
            setDatos((prev) => ({ ...prev, fecha: opcionId }));
            await cargarHorarios(datos.doctor?.id, opcionId);
          }
        }
        return;
      }

      if (estado === 'elegir_hora') {
        const horaSeleccionada = opcionId;
        const horaRegex = /^(\d{1,2}:\d{2})$/;
        if (horaRegex.test(horaSeleccionada) || horariosDisponibles.includes(horaSeleccionada)) {
          setDatos((prev) => ({ ...prev, hora: horaSeleccionada }));
          await confirmarCita(horaSeleccionada);
          return;
        }
        agregarMensaje(t('invalidOption'));
        setOpciones(horariosDisponibles.map((h) => ({ id: h, texto: h })));
        return;
      }

      if (estado === 'elegir_nueva_hora') {
        await procesarNuevaHora(opcionId);
        return;
      }

      if (estado === 'confirmar_cancelacion') {
        if (opcionId === 'si') {
          await ejecutarCancelacion();
        } else {
          agregarMensaje(t('understood'));
          setEstado('inicio');
          setOpciones(getInicioOpciones());
        }
        return;
      }

      if (estado === 'confirmar_posposicion') {
        if (opcionId === 'si') {
          await ejecutarPosposicion();
        } else {
          agregarMensaje(t('understood'));
          setEstado('inicio');
          setOpciones(getInicioOpciones());
        }
        return;
      }

      // Switch para casos de alto nivel
      switch (opcionIdStr) {
        case 'agendar':
          if (especialidades.length === 0) {
            agregarMensaje(t('noDataAvailable'));
            setEstado('inicio');
            setOpciones([
              { id: 'agendar', texto: t('scheduleAppointment') },
              { id: 'mis_citas', texto: t('myAppointments') },
            ]);
          } else {
            if (userRole === 'admin' || userRole === 'doctor') {
              agregarMensaje(t('selectPatient') || 'Por favor, selecciona un paciente. Puedes escribir su nombre:');
              setEstado('elegir_paciente');
              setOpciones([]);
              setBusquedaPaciente('');
              setSugerenciasPacientes([]);
            } else {
              agregarMensaje(t('whatSpecialty'));
              setEstado('elegir_especialidad');
              setOpciones(
                especialidades.map((esp) => ({
                  id: esp.id,
                  texto: esp.nombre,
                }))
              );
              if (especialidades.length > 0) {
                agregarMensaje(t('selectSpecialtyOption'), 'ia');
              }
            }
          }
          break;

        case 'elegir_especialidad': {
          const espSeleccionada = especialidades.find(
            (e) => e.id === parseInt(opcionId)
          );
          if (espSeleccionada) {
            setDatos((prev) => ({ ...prev, especialidad: espSeleccionada }));
            const doctoresFiltrados = doctores.filter(
              (d) =>
                d.especialidad === espSeleccionada.id ||
                d.especialidad_nombre === espSeleccionada.nombre
            );
            if (doctoresFiltrados.length === 0) {
              agregarMensaje(`${t('noDoctorsAvailable')} ${espSeleccionada.nombre}.`);
              agregarMensaje(t('chooseSpecialty'));
              setEstado('elegir_especialidad');
              setOpciones(
                especialidades.map((esp) => ({
                  id: esp.id,
                  texto: esp.nombre,
                }))
              );
            } else {
              agregarMensaje(t('whichDoctor'));
              setEstado('elegir_doctor');
              setOpciones(
                doctoresFiltrados.map((d) => ({
                  id: d.id,
                  texto: `Dr. ${d.usuario?.first_name} ${d.usuario?.last_name} - ${d.especialidad_nombre || d.otra_especialidad}`,
                }))
              );
            }
          }
          break;
        }

        case 'elegir_doctor': {
          const doctorSeleccionado = doctores.find(
            (d) => d.id === parseInt(opcionId)
          );
          if (doctorSeleccionado) {
            setDatos((prev) => ({ ...prev, doctor: doctorSeleccionado }));
            agregarMensaje(t('whatDate'));
            setEstado('elegir_fecha');
            setOpciones([
              { id: 'hoy', texto: t('today') },
              { id: 'manana', texto: t('tomorrow') },
              { id: 'otra', texto: t('otherDate') },
            ]);
          }
          break;
        }

        case 'elegir_fecha':
        case 'hoy':
        case 'manana':
        case 'otra':
          if (opcionId === 'hoy') {
            const hoy = new Date().toISOString().split('T')[0];
            setDatos((prev) => ({ ...prev, fecha: hoy }));
            await cargarHorarios(datos.doctor?.id, hoy);
          } else if (opcionId === 'manana') {
            const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            setDatos((prev) => ({ ...prev, fecha: manana }));
            await cargarHorarios(datos.doctor?.id, manana);
          } else if (opcionId === 'otra') {
            const mesesOptions = generarMesesOptions();
            agregarMensaje(t('selectMonth'));
            setEstado('elegir_mes');
            setOpciones(mesesOptions);
            return;
          }
          break;

        case 'elegir_mes': {
          setMesSeleccionado(opcionId);
          const [anioMes, mesNum] = opcionId.split('-');
          const diasOptions = generarDiasOptions(parseInt(anioMes), parseInt(mesNum));
          agregarMensaje(t('selectDay'));
          setEstado('elegir_dia');
          setOpciones(diasOptions);
          return;
        }

        case 'elegir_dia': {
          if (/^\d{4}-\d{2}-\d{2}$/.test(opcionId)) {
            setDatos((prev) => ({ ...prev, fecha: opcionId }));
            await cargarHorarios(datos.doctor?.id, opcionId);
          }
          return;
        }

        case 'esperando_fecha':
          // manejado en manejarInput
          break;

        case 'elegir_hora': {
          const horaSeleccionadaSwitch = opcionId;
          if (horaSeleccionadaSwitch && /^(\d{2}:\d{2})$/.test(horaSeleccionadaSwitch)) {
            setDatos((prev) => ({ ...prev, hora: horaSeleccionadaSwitch }));
            await confirmarCita();
          } else if (horariosDisponibles.includes(opcionId)) {
            setDatos((prev) => ({ ...prev, hora: opcionId }));
            await confirmarCita();
          } else {
            agregarMensaje(t('invalidOption'));
            setOpciones(horariosDisponibles.map((h) => ({ id: h, texto: h })));
          }
           break;
        }

        case 'confirmar':
          if (datos.especialidad && datos.doctor && datos.fecha && datos.hora) {
            await crearCita();
          } else {
            agregarMensaje(t('missingData'));
            setEstado('inicio');
            setDatos({ especialidad: null, doctor: null, fecha: null, hora: null });
            setOpciones([
              { id: 'agendar', texto: t('scheduleAppointment') },
              { id: 'mis_citas', texto: t('myAppointments') },
            ]);
          }
          break;

        case 'mis_citas':
          setLoading(true);
          try {
            const misCitas = await chatService.getMisCitas();
            if (misCitas.length === 0) {
              agregarMensaje(t('noAppointments'));
            } else {
              agregarMensaje(t('yourAppointments'), 'ia');
              misCitas.forEach((cita) => {
                agregarMensaje(
                  `- ${cita.fecha} a las ${cita.hora} con Dr. ${cita.doctor_nombre} (${cita.estado})`,
                  'ia'
                );
              });
            }
          } catch (error) {
            console.error('Error cargando citas:', error);
            agregarMensaje(t('errorLoadingAppointments'));
          }
          setEstado('inicio');
          setOpciones([
            { id: 'agendar', texto: t('scheduleAppointment') },
            { id: 'ayuda', texto: t('needHelp') },
          ]);
          break;

        case 'ayuda':
          agregarMensaje(t('howCanHelp'));
          setOpciones([
            { id: 'info', texto: t('clinicInfo') },
            { id: 'contacto', texto: t('contactSupport') },
            { id: 'volver', texto: t('backToMain') },
          ]);
          setEstado('ayuda');
          break;

        case 'info':
          agregarMensaje(
            '🏥 *Información de la clínica*\n\n📍 *Dirección:* Benfica, Luanda, Angola\n\n📞 *Teléfono:* +244 923 456 789\n\n✉️ *Email:* contacto@drabelkismorejon.co.ao\n\n🕐 *Horarios:* Lunes a Viernes: 8:00 - 18:00\n\nEstamos especializados en atención médica integral con un equipo de profesionales altamente cualificados.'
          );
          setOpciones(getInicioOpciones());
          setEstado('inicio');
          break;

        case 'contacto':
          agregarMensaje(
            '📞 *Contactar a soporte*\n\nSi necesitas ayuda adicional, puedes comunicarte con nosotros:\n\n📱 *WhatsApp:* +244 923 456 789\n✉️ *Email:* contacto@drabelkismorejon.co.ao\n\nNuestro equipo te atenderá lo antes posible.'
          );
          setOpciones(getInicioOpciones());
          setEstado('inicio');
          break;

        case 'volver':
          agregarMensaje(t('understood'));
          setEstado('inicio');
          setOpciones(getInicioOpciones());
          break;

        case 'cancelar':
          if (estado === 'confirmar') {
            agregarMensaje(t('understood'));
            setEstado('inicio');
            setDatos({ especialidad: null, doctor: null, fecha: null, hora: null });
            setOpciones(getInicioOpciones());
          } else {
            await mostrarCitasParaAccion('cancelar');
          }
          break;

        case 'cancelar_cita':
          if (userRole === 'admin' || userRole === 'doctor') {
            setAccionCita('cancelar');
            setDatos((prev) => ({ ...prev, paciente: null }));
            agregarMensaje(t('selectPatient'));
            setEstado('elegir_paciente_accion');
            setOpciones([]);
            setBusquedaPaciente('');
            setSugerenciasPacientes([]);
          } else {
            await mostrarCitasParaAccion('cancelar');
          }
          break;

        case 'posponer':
          if (userRole === 'admin' || userRole === 'doctor') {
            setAccionCita('posponer');
            setDatos((prev) => ({ ...prev, paciente: null }));
            agregarMensaje(t('selectPatient'));
            setEstado('elegir_paciente_accion');
            setOpciones([]);
            setBusquedaPaciente('');
            setSugerenciasPacientes([]);
          } else {
            await mostrarCitasParaAccion('posponer');
          }
          break;

        case 'elegir_cita_cancelar':
          await procesarCancelacion(parseInt(opcionId));
          break;

        case 'elegir_cita_posponer':
          await procesarPosponer(parseInt(opcionId));
          break;

        case 'confirmar_cancelacion':
          if (opcionId === 'si') {
            await ejecutarCancelacion();
          } else {
            agregarMensaje(t('understood'));
            setEstado('inicio');
            setOpciones(getInicioOpciones());
          }
          break;

        case 'elegir_nueva_fecha':
          await procesarNuevaFecha(opcionId);
          break;

        case 'elegir_nueva_hora':
          await procesarNuevaHora(opcionId);
          break;

        case 'confirmar_posposicion':
          if (opcionId === 'si') {
            await ejecutarPosposicion();
          } else {
            agregarMensaje(t('understood'));
            setEstado('inicio');
            setOpciones(getInicioOpciones());
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error en seleccionarOpcion:', error);
      agregarMensaje(t('loadingError'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, userRole, opciones, especialidades, doctores, historial, datos, horariosDisponibles, citaSeleccionada]);

  // Helper para generar opciones de inicio
  const getInicioOpciones = useCallback(() => [
    { id: 'agendar', texto: t('scheduleAppointment') },
    { id: 'mis_citas', texto: t('myAppointments') },
    { id: 'cancelar_cita', texto: t('cancelAppointmentOption') },
    { id: 'posponer', texto: t('postponeAppointmentOption') },
    { id: 'ayuda', texto: t('needHelp') },
  ], [t]);

  const cargarHorarios = useCallback(async (doctorId, fecha) => {
    setLoading(true);
    try {
      const [horariosData, citasOcupadas] = await Promise.all([
        chatService.getHorariosDisponibles(doctorId, fecha),
        chatService.getCitasOcupadas(doctorId, fecha),
      ]);
      const horasOcupadas = citasOcupadas.map((c) => c.hora);

      const slots = [];
      const ahora = new Date();
      const esHoy = fecha === ahora.toISOString().split('T')[0];

      horariosData.forEach((horario) => {
        if (!horario.activo) return;
        const [horaInicio, minInicio] = horario.hora_inicio.split(':').map(Number);
        const [horaFin, minFin] = horario.hora_fin.split(':').map(Number);
        let horaActual = new Date();
        horaActual.setHours(horaInicio, minInicio, 0);
        const horaFinal = new Date();
        horaFinal.setHours(horaFin, minFin, 0);
        while (horaActual < horaFinal) {
          const horaStr = horaActual.toTimeString().slice(0, 5);
          if (!horasOcupadas.includes(horaStr)) {
            if (esHoy) {
              if (horaActual > ahora) {
                slots.push(horaStr);
              }
            } else {
              slots.push(horaStr);
            }
          }
          horaActual.setMinutes(horaActual.getMinutes() + 30);
        }
      });

      setHorariosDisponibles(slots);
      if (slots.length === 0) {
        agregarMensaje(t('noAvailableSlots'));
        setEstado('elegir_fecha');
        setOpciones([
          { id: 'hoy', texto: t('today') },
          { id: 'manana', texto: t('tomorrow') },
          { id: 'otra', texto: t('otherDate') },
        ]);
      } else {
        setDatos((prev) => ({ ...prev, fecha }));
        agregarMensaje(t('selectTime'));
        setEstado('elegir_hora');
        setOpciones(slots.map((h) => ({ id: h, texto: h })));
      }
    } catch (error) {
      console.error('Error cargando horarios:', error);
      agregarMensaje(t('loadingError'));
    } finally {
      setLoading(false);
    }
  }, [agregarMensaje, t]);

  const confirmarCita = useCallback((horaSeleccionada = datos.hora) => {
    const doctorName =
      datos.doctor?.usuario?.first_name && datos.doctor?.usuario?.last_name
        ? `${datos.doctor.usuario.first_name} ${datos.doctor.usuario.last_name}`
        : '';
    const horaFinal = horaSeleccionada || datos.hora || t('notSpecified');
    const resumen = `${t('appointmentSummary')}:

${t('doctor')}: Dr. ${doctorName}
${t('date')}: ${datos.fecha}
${t('time')}: ${horaFinal}

${t('confirmAppointment')}`;
    agregarMensaje(resumen);
    setEstado('confirmar');
    setOpciones([
      { id: 'confirmar', texto: t('confirm') },
      { id: 'cancelar', texto: t('cancel') },
    ]);
  }, [datos, agregarMensaje, t]);

  const crearCita = useCallback(async () => {
    setLoading(true);
    try {
      const pacienteId = datos.paciente?.id || datos.paciente;
      const requestBody = {
        doctor: datos.doctor.id,
        fecha: datos.fecha,
        hora: datos.hora,
        motivo: '',
      };
      if (pacienteId) {
        requestBody.paciente = pacienteId;
      }
      await chatService.crearCita(requestBody);
      const doctorName = `${datos.doctor?.usuario?.first_name || ''} ${datos.doctor?.usuario?.last_name || ''}`;
      agregarMensaje(t('appointmentConfirmed'));
      agregarMensaje(t('appointmentBooked', { doctorName, date: datos.fecha, time: datos.hora }));
      setEstado('inicio');
      setDatos({ especialidad: null, doctor: null, fecha: null, hora: null });
      setOpciones([
        { id: 'agendar', texto: t('bookAnother') },
        { id: 'mis_citas', texto: t('viewMyAppointments') },
      ]);
    } catch (error) {
      console.error('Error creando cita:', error);
      if (error.response?.status >= 200 && error.response?.status < 300) {
        const doctorName = `${datos.doctor?.usuario?.first_name || ''} ${datos.doctor?.usuario?.last_name || ''}`;
        agregarMensaje(t('appointmentConfirmed'));
        agregarMensaje(t('appointmentBooked', { doctorName, date: datos.fecha, time: datos.hora }));
      } else if (error.response?.data) {
        const data = error.response.data;
        if (data.non_field_errors) {
          agregarMensaje(`Error: ${data.non_field_errors.join(', ')}`);
        } else if (typeof data === 'string') {
          agregarMensaje(`Error: ${data}`);
        } else {
          agregarMensaje(`Error: ${JSON.stringify(data)}`);
        }
      } else {
        agregarMensaje(t('loadingError'));
      }
    } finally {
      setLoading(false);
    }
  }, [datos, agregarMensaje, t]);

  const manejarInput = useCallback((e) => {
    e.preventDefault();
    if (mensaje.trim() && estado === 'esperando_fecha') {
      seleccionarOpcion(mensaje.trim());
      setMensaje('');
    }
  }, [mensaje, estado, seleccionarOpcion]);

  const generarMesesOptions = useCallback(() => {
    const meses = [];
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth();
    for (let i = 0; i < 6; i++) {
      let mes = (mesActual + i) % 12;
      let anio = anioActual + Math.floor((mesActual + i) / 12);
      meses.push({
        id: `${anio}-${String(mes + 1).padStart(2, '0')}`,
        texto: `${mesesNombres[mes]}-${anio}`,
      });
    }
    return meses;
  }, []);

  const generarDiasOptions = useCallback((anio, mes) => {
    const dias = [];
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const diaActual = new Date().getDate();
    const anioActual = new Date().getFullYear();
    const mesActual = new Date().getMonth() + 1;
    let diaInicio = 1;
    if (anio === anioActual && mes === mesActual) {
      diaInicio = diaActual;
    }
    for (let d = diaInicio; d <= diasEnMes; d++) {
      const jsDay = new Date(anio, mes - 1, d).getDay();
      const diaSemanaDjango = (jsDay + 6) % 7;
      if (horariosSemana.length > 0 && !horariosSemana.includes(diaSemanaDjango)) {
        continue;
      }
      dias.push({
        id: `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        texto: String(d),
      });
    }
    return dias;
  }, [horariosSemana]);

  const mostrarCitasParaAccion = useCallback(async (accion, pacienteId = null) => {
    setLoading(true);
    try {
      const params = {};
      if (userRole === 'admin' || userRole === 'doctor') {
        if (pacienteId) {
          params.paciente = pacienteId;
        }
      }
      const misCitas = userRole === 'patient'
        ? await chatService.getMisCitas()
        : await chatService.getCitas(params);
      const citasPendientes = misCitas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada');
      setCitasDisponibles(citasPendientes);
      if (citasPendientes.length === 0) {
        agregarMensaje(accion === 'cancelar' ? t('noCitasToCancel') : t('noCitasToPostpone'));
        setEstado('inicio');
        setOpciones(getInicioOpciones());
      } else {
        agregarMensaje(accion === 'cancelar' ? t('selectAppointmentToCancel') : t('selectAppointmentToPostpone'));
        setEstado(accion === 'cancelar' ? 'elegir_cita_cancelar' : 'elegir_cita_posponer');
        setOpciones(
          citasPendientes.map((c) => ({
            id: c.id,
            texto: `${c.fecha} - ${c.hora} con Dr. ${c.doctor_nombre}`,
          }))
        );
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
      agregarMensaje(t('loadingError'));
    } finally {
      setLoading(false);
    }
  }, [userRole, agregarMensaje, t, getInicioOpciones]);

  // [PENDIENTE FASE 4] Importar axiosInstance aquí, o usar chatService
  // (mostrarCitasParaAccion usa chatService en lugar de axiosInstance directo)

  const procesarCancelacion = useCallback(async (citaId) => {
    const cita = citasDisponibles.find((c) => c.id === citaId);
    if (cita) {
      setCitaSeleccionada(cita);
      agregarMensaje(`${t('confirmCancellation')}\n\n📅 ${cita.fecha} - ${cita.hora}\n👨‍⚕️ Dr. ${cita.doctor_nombre}`);
      setEstado('confirmar_cancelacion');
      setOpciones([
        { id: 'si', texto: t('yes') },
        { id: 'no', texto: t('no') },
      ]);
    }
  }, [citasDisponibles, agregarMensaje, t]);

  const procesarPosponer = useCallback(async (citaId) => {
    const cita = citasDisponibles.find((c) => c.id === citaId);
    if (cita) {
      setCitaSeleccionada(cita);
      const citaDoctor = cita.doctor || cita.doctor_id;
      const doctorId = typeof citaDoctor === 'object' ? citaDoctor.id : citaDoctor;
      const dias = await cargarHorariosSemana(doctorId);
      const opcionesFecha = [];
      const hoy = new Date();
      const diaHoy = (hoy.getDay() + 6) % 7;
      if (dias.includes(diaHoy)) {
        opcionesFecha.push({ id: 'hoy', texto: t('today') });
      }
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      const diaManana = (manana.getDay() + 6) % 7;
      if (dias.includes(diaManana)) {
        opcionesFecha.push({ id: 'manana', texto: t('tomorrow') });
      }
      opcionesFecha.push({ id: 'otra', texto: t('otherDate') });
      agregarMensaje(t('selectNewDate'));
      setEstado('elegir_nueva_fecha');
      setOpciones(opcionesFecha);
    }
  }, [citasDisponibles, cargarHorariosSemana, agregarMensaje, t]);

  const cargarHorariosNuevos = useCallback(async (doctorId, fecha) => {
    setLoading(true);
    try {
      const [horariosData, citasOcupadas] = await Promise.all([
        chatService.getHorariosDisponibles(doctorId, fecha),
        chatService.getCitasOcupadas(doctorId, fecha),
      ]);
      const horasOcupadas = citasOcupadas.map((c) => c.hora);
      const slots = [];
      const ahora = new Date();
      const esHoy = fecha === ahora.toISOString().split('T')[0];
      horariosData.forEach((horario) => {
        if (!horario.activo) return;
        const [horaInicio, minInicio] = horario.hora_inicio.split(':').map(Number);
        const [horaFin, minFin] = horario.hora_fin.split(':').map(Number);
        let horaActual = new Date();
        horaActual.setHours(horaInicio, minInicio, 0);
        const horaFinal = new Date();
        horaFinal.setHours(horaFin, minFin, 0);
        while (horaActual < horaFinal) {
          const horaStr = horaActual.toTimeString().slice(0, 5);
          if (!horasOcupadas.includes(horaStr)) {
            if (esHoy) {
              if (horaActual > ahora) {
                slots.push(horaStr);
              }
            } else {
              slots.push(horaStr);
            }
          }
          horaActual.setMinutes(horaActual.getMinutes() + 30);
        }
      });
      setHorariosNuevos(slots);
      if (slots.length === 0) {
        agregarMensaje(t('noAvailableSlots'));
        setOpciones([
          { id: 'hoy', texto: t('today') },
          { id: 'manana', texto: t('tomorrow') },
          { id: 'otra', texto: t('otherDate') },
        ]);
      } else {
        setNuevaFecha(fecha);
        agregarMensaje(t('selectNewTime'));
        setEstado('elegir_nueva_hora');
        setOpciones(slots.map((h) => ({ id: h, texto: h })));
      }
    } catch (error) {
      console.error('Error cargando horarios:', error);
      agregarMensaje(t('loadingError'));
    } finally {
      setLoading(false);
    }
  }, [agregarMensaje, t]);

  const procesarNuevaFecha = useCallback(async (opcionId) => {
    let fechaSeleccionada;
    if (opcionId === 'hoy') {
      fechaSeleccionada = new Date().toISOString().split('T')[0];
    } else if (opcionId === 'manana') {
      fechaSeleccionada = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    } else {
      agregarMensaje(t('selectMonth'));
      setEstado('elegir_mes');
      setOpciones(generarMesesOptions());
      return;
    }
    setNuevaFecha(fechaSeleccionada);
    const citaDoctor = citaSeleccionada.doctor || citaSeleccionada.doctor_id;
    const doctorId = typeof citaDoctor === 'object' ? citaDoctor.id : citaDoctor;
    await cargarHorariosNuevos(doctorId, fechaSeleccionada);
  }, [citaSeleccionada, agregarMensaje, t, generarMesesOptions, cargarHorariosNuevos]);

  const procesarNuevaHora = useCallback(async (horaSeleccionada) => {
    setNuevaHora(horaSeleccionada);
    const resumen = `${t('appointmentSummary')}:

📅 ${nuevaFecha}
⏰ ${horaSeleccionada}
👨‍⚕️ Dr. ${citaSeleccionada?.doctor_nombre}

${t('confirmPostponement')}`;
    agregarMensaje(resumen);
    setEstado('confirmar_posposicion');
    setOpciones([
      { id: 'si', texto: t('yes') },
      { id: 'no', texto: t('no') },
    ]);
  }, [nuevaFecha, citaSeleccionada, agregarMensaje, t]);

  const ejecutarCancelacion = useCallback(async () => {
    setLoading(true);
    try {
      await chatService.cancelarCita(citaSeleccionada.id);
      agregarMensaje(t('appointmentCancelled'));
      setEstado('inicio');
      setCitaSeleccionada(null);
      setOpciones(getInicioOpciones());
    } catch (error) {
      console.error('Error cancelando cita:', error);
      if (error.response?.status === 200 || error.response?.status === 201 || error.response?.status === 204) {
        agregarMensaje(t('appointmentCancelled'));
      } else if (error.response?.status === 404 && error.response?.data?.detail === 'Already cancelled') {
        agregarMensaje(t('appointmentCancelled'));
      } else if (error.response?.data) {
        const data = error.response.data;
        if (data.detail) {
          agregarMensaje(`Error: ${data.detail}`);
        } else if (data.non_field_errors) {
          agregarMensaje(`Error: ${data.non_field_errors.join(', ')}`);
        } else {
          agregarMensaje(`Error: ${JSON.stringify(data)}`);
        }
      } else {
        agregarMensaje(t('loadingError'));
      }
    } finally {
      setLoading(false);
    }
  }, [citaSeleccionada, agregarMensaje, t, getInicioOpciones]);

  const ejecutarPosposicion = useCallback(async () => {
    setLoading(true);
    try {
      await chatService.posponerCita(citaSeleccionada.id, {
        fecha: nuevaFecha,
        hora: nuevaHora,
      });
      agregarMensaje(t('appointmentPostponed'));
      agregarMensaje(`📅 ${nuevaFecha} a las ${nuevaHora}`);
      setEstado('inicio');
      setCitaSeleccionada(null);
      setNuevaFecha(null);
      setNuevaHora(null);
      setOpciones(getInicioOpciones());
    } catch (error) {
      console.error('Error posponiendo cita:', error);
      if (error.response?.data) {
        const data = error.response.data;
        if (data.detail) {
          agregarMensaje(`Error: ${data.detail}`);
        } else if (data.non_field_errors) {
          agregarMensaje(`Error: ${data.non_field_errors.join(', ')}`);
        } else {
          agregarMensaje(`Error: ${JSON.stringify(data)}`);
        }
      } else {
        agregarMensaje(t('loadingError'));
      }
    } finally {
      setLoading(false);
    }
  }, [citaSeleccionada, nuevaFecha, nuevaHora, agregarMensaje, t, getInicioOpciones]);

  const reiniciar = useCallback(() => {
    setEstado('inicio');
    setHistorial([]);
    setDatos({ especialidad: null, doctor: null, fecha: null, hora: null, paciente: null });
    setOpciones([]);
    setMensaje('');
    messageIdRef.current = 0;
    inicializar(false);
  }, [inicializar]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return {
    // Estado
    estado, loading, mensaje, historial, opciones, datos,
    especialidades, doctores, horariosDisponibles, horariosSemana,
    horariosNuevos, mesSeleccionado, setMesSeleccionado,
    userRole, busquedaPaciente, setBusquedaPaciente,
    sugerenciasPacientes, mostrarSugerencias, setMostrarSugerencias,
    accionCita, citasDisponibles, citaSeleccionada,
    nuevaFecha, nuevaHora,
    chatEndRef, messageIdRef,
    language,
    // Funciones
    setEstado, setMensaje, setOpciones, setDatos,
    setHorariosDisponibles,
    agregarMensaje, inicializar, seleccionarOpcion, seleccionarPaciente,
    buscarPacientes, manejarInput, confirmarCita, crearCita,
    mostrarCitasParaAccion, procesarCancelacion, procesarPosponer,
    procesarNuevaFecha, procesarNuevaHora, ejecutarCancelacion,
    ejecutarPosposicion, reiniciar, scrollToBottom, getInicioOpciones,
  };
};

export default useChatIA;
